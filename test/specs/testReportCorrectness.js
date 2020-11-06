/*
  Copyright 2019 Google LLC

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

var example = [
  {
    filePath:
      "/var/lib/jenkins/workspace/Releases/ESLint Release/eslint/fullOfProblems.js",
    messages: [
      {
        ruleId: "no-unused-vars",
        severity: 2,
        message: "'addOne' is defined but never used.",
        line: 1,
        column: 10,
        nodeType: "Identifier",
        source: "function addOne(i) {"
      },
      {
        ruleId: "use-isnan",
        severity: 2,
        message: "Use the isNaN function to compare with NaN.",
        line: 2,
        column: 9,
        nodeType: "BinaryExpression",
        source: "    if (i != NaN) {"
      },
      {
        ruleId: "space-unary-ops",
        severity: 2,
        message: "Unexpected space before unary operator '++'.",
        line: 3,
        column: 16,
        nodeType: "UpdateExpression",
        source: "        return i ++",
        fix: { range: [57, 58], text: "" }
      },
      {
        ruleId: "semi",
        severity: 1,
        message: "Missing semicolon.",
        line: 3,
        column: 20,
        nodeType: "ReturnStatement",
        source: "        return i ++",
        fix: { range: [60, 60], text: ";" }
      },
      {
        ruleId: "no-else-return",
        severity: 1,
        message: "Unnecessary 'else' after 'return'.",
        line: 4,
        column: 12,
        nodeType: "BlockStatement",
        source: "    } else {",
        fix: {
          range: [0, 94],
          text:
            "function addOne(i) {\n    if (i != NaN) {\n        return i ++\n    } \n      return\n    \n}"
        }
      },
      {
        ruleId: "indent",
        severity: 1,
        message: "Expected indentation of 8 spaces but found 6.",
        line: 5,
        column: 1,
        nodeType: "Keyword",
        source: "      return",
        endLine: 5,
        endColumn: 7,
        fix: { range: [74, 80], text: "        " }
      },
      {
        ruleId: "consistent-return",
        severity: 2,
        message: "Function 'addOne' expected a return value.",
        line: 5,
        column: 7,
        nodeType: "ReturnStatement",
        source: "      return"
      },
      {
        ruleId: "semi",
        severity: 1,
        message: "Missing semicolon.",
        line: 5,
        column: 13,
        nodeType: "ReturnStatement",
        source: "      return",
        fix: { range: [86, 86], text: ";" }
      },
      {
        ruleId: "no-extra-semi",
        severity: 2,
        message: "Unnecessary semicolon.",
        line: 7,
        column: 2,
        nodeType: "EmptyStatement",
        source: "};",
        fix: { range: [93, 95], text: "}" }
      }
    ],
    errorCount: 5,
    warningCount: 4,
    fixableErrorCount: 2,
    fixableWarningCount: 4,
    source:
      "function addOne(i) {\n    if (i != NaN) {\n        return i ++\n    } else {\n      return\n    }\n};"
  }
];

var assert = require("assert");

describe("report correctness", function() {

  it("should create a report object with valid schema", function() {
    var schema = require("./../fixtures/reportSchema.js"),
      Validator = require("jsonschema").Validator,
      v = new Validator(),
      validationResult = v.validate(example, schema);
    assert.equal(0, validationResult.errors.length);
  });

});
