/*
  Copyright 2019-2023 Google LLC

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
/* global describe, it, configuration */
/* jslint esversion:9 */

const assert = require("assert"),
  pu = require("../../lib/package/plugins/_pluginUtil.js");

describe("TemplateCheck", function () {
  const testCases = [
    ["{}", "empty function name at position 1"],
    ["{a}", undefined],
    ["{{a}", "unexpected character at position 1: {"],
    ["{{a}}", "unexpected character at position 1: {"],
    ["{[]}", "unexpected character at position 1: ["],
    ["{a[]}", "unexpected character at position 2: ["],
    ["{a", "unterminated curly brace"],
    ["}a", "unexpected close curly at position 0"],
    ["{a}}", "unexpected close curly at position 3"],
    ["}a{", "unexpected close curly at position 0"],
    ["{a}b", undefined],
    ["{a}{b}", undefined],
    ["{a}.{b}", undefined],
    ["{a.b}", undefined],
    ["{3}", "unexpected character at position 1: 3"],
    [
      "{timeFormatUTCMs(propertyset.set1.timeformat,system.timestamp)}",
      undefined,
    ],
    [
      "{timeFormatUTCMs(propertyset.set1.timeformat,system.timestamp) }",
      "unexpected character at position 62:  ",
    ],
    [
      `{  "organization": "{organization.name}", "environment": "{environment.name}" } `,
      undefined,
    ],
    [
      `{  "organization": "{organization.name}", "environment": "{environment.{name}}" } `,
      "unexpected character at position 71: {",
    ],
    [
      `{  "organization": "{organization.name}", "other": {"environment": "{environment.name}" } } `,
      undefined,
    ],
    ["{createUuid()}", undefined],
    ["{createUuid( )}", "spaces between parens for function createUuid"],
    ["{timeFormatUTCMs()}", "empty arg string for function timeFormatUTCMs"],
    ["{notARealfunction()}", "unsupported function name (notARealfunction)"],
    ["{createUuid[]}", "unexpected character at position 11: ["],
    ["{ createUuid() }", undefined], // but ineffective
  ];

  testCases.forEach((item, _ix) => {
    const [expression, expectedError] = item;
    it(`validateTemplate (${expression}) should return ${expectedError}`, function () {
      const actualResult = pu.validateTemplate(expression);
      assert.equal(actualResult, expectedError);
    });
  });
});

describe("PropertySetRefCheck", function () {
  const testCases = [
    ["{foo.bar}", undefined],
    [
      "{foo.bar}.{var2}.setting",
      "there is more than one dot in the template result",
    ],
    ["foo.bar.var2.setting", "there are 3 dots ( !=1 ) in the template result"],
    ["{foo.bar}.setting", undefined],
    ["{foo.bar}.{flow.var2}", undefined],
  ];

  testCases.forEach((item, _ix) => {
    const [expression, expectedResult] = item;
    it(`PropertySetRef (${expression}) should be ${
      expectedResult ? "valid" : "not valid"
    }`, function () {
      const actualResult = pu.validatePropertySetRef(expression);
      assert.equal(actualResult, expectedResult);
    });
  });
});
