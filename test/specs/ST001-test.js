/*
  Copyright 2019-2021,2025 Google LLC

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
/* global it, describe */

const testID = "ST001",
  assert = require("assert"),
  path = require("node:path"),
  util = require("node:util"),
  debug = require("debug")("apigeelint:" + testID),
  Step = require("../../lib/package/Step.js"),
  bl = require("../../lib/package/bundleLinter.js"),
  plugin = require(bl.resolvePlugin(testID)),
  Dom = require("@xmldom/xmldom").DOMParser,
  test = function (caseNum, stepExp, assertion) {
    it(`tests case ${caseNum}, expect(${assertion})`, function () {
      var sDoc = new Dom().parseFromString(stepExp);
      this.getLines = function () {
        return stepExp;
      };
      let step = new Step(sDoc.documentElement, this);
      step.addMessage = function (msg) {
        debug(msg);
      };

      plugin.onStep(step, function (err, result) {
        assert.equal(err, undefined, err ? " err " : " no err");
        assert.equal(
          result,
          assertion,
          result
            ? "warning/error was returned"
            : "warning/error was not returned",
        );
      });
    });
  };

describe(`${testID} - ${plugin.plugin.name}`, function () {
  test(
    1,
    `<Step>
      <Condition>message.content != ""</Condition>
      <Name>ExtractVariables-4</Name>
  </Step>`,
    false,
  );

  test(
    2,
    `<Step>
      <Condition>message.content != ""</Condition>
      <Name></Name>
  </Step>`,
    true,
  );

  test(
    3,
    `
              <Step>
                  <Name>jsonThreatProtection</Name>
                  <Condition>request.verb != "GET"</Condition>
              </Step>
  `,
    false,
  );

  it(`${testID} should create a report object with valid schema for ${configuration.source.path}`, function () {
    const Bundle = require("../../lib/package/Bundle.js"),
      Validator = require("jsonschema").Validator,
      schema = require("./../fixtures/reportSchema.js");

    let bundle = new Bundle(configuration);

    bl.executePlugin(testID, bundle);
    let formatter = bl.getFormatter("json.js"),
      v = new Validator(),
      jsonReport = JSON.parse(formatter(bundle.getReport())),
      validationResult = v.validate(jsonReport, schema);

    assert.equal(validationResult.errors.length, 0, validationResult.errors);

    let stylimpl = bl.getFormatter("table.js");
    assert.ok(stylimpl);
    let stylReport = stylimpl(bundle.getReport());
    assert.ok(stylReport);
    debug("table formatted report: \n" + stylReport);
  });
});

describe(`ST001 - Empty Steps - apiproxy`, () => {
  it("should generate the expected errors", () => {
    let configuration = {
      debug: true,
      source: {
        type: "filesystem",
        path: path.resolve(
          __dirname,
          "../fixtures/resources/ST002-step-hygiene/apiproxy", // ST002 - not a typo
        ),
        bundleType: "apiproxy",
      },
      excluded: {},
      setExitCode: false,
      output: () => {}, // suppress output
    };

    bl.lint(configuration, (bundle) => {
      let items = bundle.getReport();
      assert.ok(items);
      assert.ok(items.length);
      debug(util.format(items));
      let proxyEndpointItems = items.filter((m) =>
        m.filePath.endsWith("endpoint1.xml"),
      );
      debug(util.format(proxyEndpointItems));
      assert.equal(proxyEndpointItems.length, 1);
      proxyEndpointItems.forEach((item) => debug(util.format(item.messages)));
      let st001Messages = proxyEndpointItems[0].messages.filter(
        (m) => m.ruleId == "ST001",
      );

      let expected = [
        {
          line: 44,
          column: 7,
          message: "Step name is empty.",
        },
        {
          line: 50,
          column: 7,
          message: "Missing Name element for Step",
        },
        {
          line: 53,
          column: 7,
          message: "Missing Name element for Step",
        },
      ];

      debug(util.format(st001Messages));
      assert.equal(st001Messages.length, expected.length);

      expected.forEach((item, ix) => {
        Object.keys(item).forEach((key) => {
          assert.equal(
            st001Messages[ix][key],
            item[key],
            `case(${ix}) key(${key})`,
          );
        });
      });
    });
  });
});

describe(`ST001 - Empty Steps - sharedflow`, () => {
  it("should generate the expected errors", () => {
    let configuration = {
      debug: true,
      source: {
        type: "filesystem",
        path: path.resolve(
          __dirname,
          "../fixtures/resources/ST001-empty-steps/sharedflowbundle",
        ),
        bundleType: "sharedflowbundle",
      },
      excluded: {},
      setExitCode: false,
      output: () => {}, // suppress output
    };

    bl.lint(configuration, (bundle) => {
      let items = bundle.getReport();
      assert.ok(items);
      assert.ok(items.length);
      debug(util.format(items));
      let endpointItems = items.filter((m) =>
        m.filePath.endsWith("default.xml"),
      );
      debug(util.format(endpointItems));
      assert.equal(endpointItems.length, 1);
      endpointItems.forEach((item) => debug(util.format(item.messages)));
      let st001Messages = endpointItems[0].messages.filter(
        (m) => m.ruleId == "ST001",
      );

      let expected = [
        {
          line: 6,
          column: 3,
          message: "Step name is empty.",
        },
        {
          line: 12,
          column: 3,
          message: "Missing Name element for Step",
        },
      ];

      debug(util.format(st001Messages));
      assert.equal(st001Messages.length, expected.length);

      expected.forEach((item, ix) => {
        Object.keys(item).forEach((key) => {
          assert.equal(
            st001Messages[ix][key],
            item[key],
            `case(${ix}) key(${key})`,
          );
        });
      });
    });
  });
});
