// Copyright © 2026 Google LLC.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

const debug = require("debug")("apigeelint:condition");

const headerVarRe = new RegExp(
  "^([a-zA-z0-9_][-a-zA-z0-9_]*)\\.header\\.([a-zA-z0-9_][-a-zA-z0-9_]*)$",
);

/*
 * Transform to Negation Normal Format.  This logic
 * normalizes "NOT (A OR B) into "NOT(A) and NOT(B)".
 **/
function toNNF(node) {
  // Base case: Literals/Strings
  if (typeof node === "string") return node;

  const { operator, operands } = node;

  // Handle Negations
  if (operator === "NOT") {
    const child = operands[0];

    // Double Negation: NOT(NOT(A)) => A
    if (child.operator === "NOT") {
      return toNNF(child.operands[0]);
    }

    // De Morgan: NOT(A AND B) => (NOT A) OR (NOT B)
    if (child.operator === "AND") {
      return toNNF({
        operator: "OR",
        operands: child.operands.map((op) => ({
          operator: "NOT",
          operands: [op],
        })),
      });
    }

    // De Morgan: NOT(A OR B) => (NOT A) AND (NOT B)
    if (child.operator === "OR") {
      return toNNF({
        operator: "AND",
        operands: child.operands.map((op) => ({
          operator: "NOT",
          operands: [op],
        })),
      });
    }

    // If it's a leaf we can't simplify further
    return { operator, operands: [toNNF(child)] };
  }

  // String comparisons may take variables referring to headers.
  // In that case, normalize header names to uppercase.
  if (
    [
      "EqualsCaseInsensitive",
      "Equals",
      "NotEquals",
      "StartsWith",
      "Matches",
      "MatchesPath",
      "JavaRegex",
    ].includes(operator)
  ) {
    let m = headerVarRe.exec(operands[0]); // left operand
    if (m) {
      operands[0] = `${m[1]}.header.${m[2].toUpperCase()}`;
    }
  }

  // normalize NotEquals to Not(Equals):  (A != B) => NOT(A = B)
  if (operator === "NotEquals") {
    return {
      operator: "NOT",
      operands: [
        {
          operator: "Equals",
          operands,
        },
      ],
    };
  }

  // Standard AND/OR (Just recurse)
  return {
    operator,
    operands: operands.map(toNNF),
  };
}

function canonicalize(node) {
  // Convert to NNF first to handle De Morgan's and NOTs
  const nnfNode = toNNF(node);

  function process(n) {
    if (typeof n === "string") {
      return { node: n, signature: n };
    }

    let ops = n.operands.map(process);

    // Flattening (Associativity)
    if (n.operator === "AND" || n.operator === "OR") {
      ops = ops.flatMap((child) =>
        child.node.operator === n.operator
          ? child.node.operands.map(process)
          : [child],
      );

      // commutativity
      ops.sort((a, b) => a.signature.localeCompare(b.signature));
    }

    const finalOperands = ops.map((o) => o.node);
    const finalSig = `${n.operator}(${ops.map((o) => o.signature).join(",")})`;

    return {
      node: { operator: n.operator, operands: finalOperands },
      signature: finalSig,
    };
  }

  return process(nnfNode);
}

function equivalent(expr1, expr2) {
  return canonicalize(expr1).signature === canonicalize(expr2).signature;
}

module.exports = {
  equivalent,
  canonicalize,
};
