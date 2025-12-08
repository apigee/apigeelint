// Copyright © 2025 Google LLC.
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

const debug = require("debug")("apigeelint:template");

const STATES = {
  UNDEFINED: -1,
  OUTSIDE_TEMPLATE: 0,
  OPEN_CURLY_OR_TEMPLATE: 1,
  READING_SYMBOL: 2,
  PENDING_CLOSE_CURLY: 3,
  PENDING_DBL_CLOSE_CURLY: 4,
  OPEN_FNARGS: 5,
  INSIDE_FNARGS: 7,
};

const CODES = {
  UPPER_A: 65,
  UPPER_Z: 90,
  LOWER_a: 97,
  LOWER_z: 122,
  ZERO: 48,
  NINE: 57,
};

const ZERO_ARG_FUNCTIONS = ["createUuid", "randomLong"];

const FUNCTION_NAMES = [
  "sha1Hex",
  "sha1Base64",
  "sha256Hex",
  "sha256Base64",
  "sha384Hex",
  "sha384Base64",
  "sha512Hex",
  "sha512Base64",
  "md5Hex",
  "md5Base64",
  "xPath",
  "xpath",
  "jsonPath",
  "substring",
  "firstnonnull",
  "replaceAll",
  "replaceFirst",
  "createUuid",
  "randomLong",
  "hmacMd5",
  "hmacSha1",
  "hmacSha224",
  "hmacSha256",
  "hmacSha384",
  "hmacSha512",
  "timeFormat",
  "timeFormatMs",
  "timeFormatUTC",
  "timeFormatUTCMs",
  "xeger",
  "encodeHTML",
  "escapeJSON",
  "escapeXML",
  "escapeXML11",
  "toUpperCase",
  "toLowerCase",
  "encodeBase64",
  "decodeBase64",
];

const whitespaceRe = new RegExp("\\s");
const isWhitespace = (c) => whitespaceRe.test(c);

const validateFunction = (expr, start, end) => {
  const fn = expr.substring(start, end);
  if (FUNCTION_NAMES.find((f) => fn == f)) {
    return { fn };
  }
  return { fn, error: "unknown function" };
};

const validateFunctionArgs = (expr, fnStart, argsStart, end) => {
  const fn = expr.substring(fnStart, argsStart - 1);
  const argsString = expr.substring(argsStart, end);
  // if (argsString.includes(' ')) {
  //   return {fn, error: 'spaces in argument string'};
  // }
  if (argsString != "" && argsString.trim() == "") {
    return { fn, error: "spaces between parens" };
  }
  if (argsString == "" && !ZERO_ARG_FUNCTIONS.includes(fn)) {
    return { fn, error: `empty arg string` };
  }
  return { fn };
};

const stateToString = (s) =>
  Object.keys(STATES).find((key) => STATES[key] == s);

/*
 * returns undefined for valid template. Returns an explanatory string if invalid.
 **/
const validateTemplate = (expr) => {
  let state = STATES.OUTSIDE_TEMPLATE;
  let fnarg = STATES.UNDEFINED;
  const states = [];
  const fnpending = [];
  let code,
    pendingCurlies = 0,
    symStart = -1,
    argsStart = -1;
  let ix = -1;
  try {
    for (const ch of expr) {
      ix++;
      debug(`state(${stateToString(state)}) ch(${ch})`);
      switch (state) {
        case STATES.OUTSIDE_TEMPLATE:
          if (ch == "{") {
            states.push(state);
            state = STATES.OPEN_CURLY_OR_TEMPLATE;
            symStart = ix;
          } else if (ch == "}") {
            if (pendingCurlies > 0) {
              pendingCurlies--;
            } else {
              debug(
                `unexpected close curly at position ${ix}, but not an error`,
              );
            }
            // state = states.pop();
          }
          break;

        case STATES.OPEN_CURLY_OR_TEMPLATE:
          if (ch == "}") {
            return `empty template reference at position ${ix}`;
          } else if (ch == "{") {
            states.push(state);
            state = STATES.OPEN_DOUBLE_CURLY;
          } else if (isWhitespace(ch) || ch == '"' || ch == "'") {
            // not a template, just a curly. This fn does not parse fully inside non-template curlies.
            pendingCurlies++;
            state = STATES.OUTSIDE_TEMPLATE;
          } else {
            // expecting symbol start, or another open curly
            code = ch.charCodeAt(0);
            if (
              ch != "_" &&
              !(code >= CODES.UPPER_A && code <= CODES.UPPER_Z) &&
              !(code >= CODES.LOWER_a && code <= CODES.LOWER_z)
            ) {
              return `unexpected character at position ${ix}: ${ch}`;
            }
            states.push(state);
            state = STATES.READING_SYMBOL;
          }
          break;

        case STATES.OPEN_DOUBLE_CURLY:
          if (ch == "}") {
            state = states.pop();
            if (state == STATES.OPEN_CURLY_OR_TEMPLATE) {
              // after final inner close, the only valid thing is another close-curly
              state = STATES.PENDING_DBL_CLOSE_CURLY;
            }
          } else if (ch == "{") {
            states.push(state);
            state = STATES.OPEN_DOUBLE_CURLY;
          }
          break;

        case STATES.PENDING_CLOSE_CURLY:
        case STATES.PENDING_DBL_CLOSE_CURLY:
          if (ch != "}") {
            debug(
              `state ${state}, unexpected character at position ${ix}: ${ch}`,
            );
            return `unexpected character at position ${ix}: ${ch}`;
          }
          state = states.pop();
          break;

        case STATES.READING_SYMBOL:
          if (ch == "{" || ch == "[" || ch == ")" || ch == "," || ch == "|") {
            debug(
              `state(${stateToString(state)}) ch(${ch}) unexpected char as position ${ix}`,
            );
            return `unexpected character at position ${ix}: ${ch}`;
          }
          if (ch == "(") {
            const r = validateFunction(expr, symStart + 1, ix);
            if (r.error) {
              return `unsupported function name (${r.fn})`;
            }
            argsStart = ix;
            state = STATES.OPEN_FNARGS;
          }
          if (ch == "}") {
            state = states.pop();
            if (state != STATES.OPEN_CURLY_OR_TEMPLATE) {
              return `state error (posn ${ix})`;
            }
            state = STATES.OUTSIDE_TEMPLATE;
          }
          break;

        case STATES.OPEN_FNARGS:
          if (
            ch == "{" ||
            ch == "[" ||
            ch == "(" ||
            ch == "}" ||
            ch == "]" ||
            ch == "," ||
            ch == "|" ||
            ch == '"'
          ) {
            return `state ${state}, unexpected character at position ${ix}: ${ch}`;
          }
          if (ch == ")") {
            const r = validateFunctionArgs(
              expr,
              symStart + 1,
              argsStart + 1,
              ix,
            );
            if (r.error) {
              return `${r.error} for function ${r.fn}`;
            }
            state = states.pop(); // ??
            state = STATES.PENDING_CLOSE_CURLY;
          } else {
            if (ch == "'") {
              debug(`state ${state}, open quote`);
              fnpending.push("'");
            }
            state = STATES.INSIDE_FNARGS;
          }
          break;

        case STATES.INSIDE_FNARGS:
          debug(`state(${state})  fnargs(${fnpending.join("")}) ch<${ch}>`);
          if (ch == "[" || ch == "{" || ch == "(") {
            fnpending.push(ch);
          } else if (ch == "'" || ch == '"') {
            if (fnpending.at(-1) == ch) {
              fnpending.pop();
            } else {
              fnpending.push(ch);
            }
          } else if (ch == "]" || ch == "}") {
            if (
              (ch == "]" && fnpending.at(-1) == "[") ||
              (ch == "}" && fnpending.at(-1) == "{")
            ) {
              fnpending.pop();
            } else {
              return `unexpected ${ch} character at position ${ix}`;
            }
          } else if (ch == ")") {
            if (fnpending.at(-1) == "(") {
              fnpending.pop();
            } else if (fnpending.length != 0) {
              // return `state ${state}, unexpected ${ch} character at position ${ix}. unclosed ${fnpending.at(-1)}?`;
              return `unterminated open ${fnpending.at(-1)} at position ${ix}`;
            } else {
              const r = validateFunctionArgs(
                expr,
                symStart + 1,
                argsStart + 1,
                ix,
              );
              if (r.error) {
                return `${r.error} for function ${r.fn}`;
              }
              state = states.pop(); // ??
              state = STATES.PENDING_CLOSE_CURLY;
            }
          }
          break;

        case STATES.PENDING_CLOSE_CURLY:
          if (ch != "}") {
            return `state ${state}, unexpected character at position ${ix}: ${ch}`;
          }
          state = states.pop();
          break;

        default:
          // should not happen
          debug(`unknown state (${state})`);
          return "parse faillure";
      }
    }
  } catch (e) {
    // stack underflow
    debug(`stack underflow? exception (${e})`);
    return "extraneous close-brace at position ${ix}";
  }
  debug(`final state(${stateToString(state)})`);
  if (
    state == STATES.OUTSIDE_TEMPLATE ||
    state == STATES.OPEN_CURLY_OR_TEMPLATE
  ) {
    return undefined;
  }
  if (
    state == STATES.READING_SYMBOL ||
    state == STATES.PENDING_DBL_CLOSE_CURLY
  ) {
    return "unterminated curly brace";
  }

  return `mangled template? (${stateToString(state)})`;
};

const validatePropertySetRef = (expr) => {
  let r = validateTemplate(expr);
  if (r) {
    return r;
  }
  if (expr.includes("{")) {
    // There is a variable reference.
    // Simulate a variable substitution; the result must have at most one dot.
    const re = new RegExp("{[^}]+}", "g"),
      result = expr.replaceAll(re, "xxx");
    return (result.match(/\./g) || []).length > 1
      ? "there is more than one dot in the template result"
      : undefined;
  }
  // No variable reference; the expression must have exactly one dot.
  r = (expr.match(/\./g) || []).length;
  return r == 1
    ? undefined
    : `there are ${r} dots ( !=1 ) in the template result`;
};

module.exports = {
  validateTemplate,
  validatePropertySetRef,
};
