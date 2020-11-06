/*
  Copyright 2019-2020 Google LLC

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

const assert = require("assert"),
  TruthTable = require("../../lib/package/TruthTable.js"),
  test = function(exp, assertion) {
        it(`${exp} should be ${assertion}`, function() {
      var tt = new TruthTable(exp),
      ast=tt.getAST();

      console.log(ast);
    });
  };

describe("TruthTable AST", function() {

  test("b!=1", "valid");
  test("b=c", "valid");
  test("b=2", "valid");
  test("b!=c", "valid");
  test("b=c and d=e", "valid");
  test("request.headers.foo = \"myFoo\"");

});
