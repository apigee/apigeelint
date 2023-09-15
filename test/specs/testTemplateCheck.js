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

describe("TemplateCheck", function() {
  const testCases = [
          ["{}", false],
          ["{a}", true],
          ["{{a}", false],
          ["{{a}}", false],
          ["{[]}", false],
          ["{a[]}", false],
          ["{a", false],
          ["}a", false],
          ["{a}}", false],
          ["}a{", false],
          ["{a}b", true],
          ["{a}{b}", true],
          ["{timeFormatUTCMs(propertyset.set1.timeformat,system.timestamp)}", true],
          ["{timeFormatUTCMs(propertyset.set1.timeformat,system.timestamp) }", false],
        ];

  testCases.forEach( (item, _ix) => {
    const [expression, expectedResult] = item;
    it(`Check template (${expression}) should return ${expectedResult}`, function() {
      const actualResult = pu.isValidTemplate(expression);
      assert.equal(actualResult, expectedResult);
    });
  });
});

describe("PropertySetRefCheck", function() {
  const testCases = [
          ["{foo.bar}", true],
          ["{foo.bar}.{var2}.setting", false],
          ["{foo.bar}.setting", true],
          ["{foo.bar}.{flow.var2}", true],
        ];

  testCases.forEach( (item, _ix) => {
    const [expression, expectedResult] = item;
    it(`PropertySetRef (${expression}) should be ${expectedResult?'valid':'not valid'}`, function() {
      const actualResult = pu.isValidPropertySetRef(expression);
      assert.equal(actualResult, expectedResult);
    });
  });
});
