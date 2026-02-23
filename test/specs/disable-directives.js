/*
  Copyright 2019-2024 Google LLC

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
/* global configuration, describe, it */
const assert = require("node:assert"),
  path = require("node:path"),
  util = require("node:util"),
  debug = require("debug")("apigeelint:directives"),
  bl = require("../../lib/package/bundleLinter.js");

describe("Directives - Check that <!-- apigeelint disable=XXX --> works", function () {
  [true, false].forEach((ignoreDirectives) =>
    it(`should issue the correct warnings when directives are ${
      ignoreDirectives ? "" : "not "
    }ignored`, () => {
      const configuration = {
        debug: true,
        source: {
          type: "filesystem",
          path: path.resolve(
            __dirname,
            "../fixtures/resources/disable-directives/apiproxy"
          ),
          bundleType: "apiproxy"
        },
        //profile: 'apigeex',
        ignoreDirectives,
        excluded: {},
        setExitCode: false,
        output: () => {} // suppress output
      };

      debug("test configuration: " + JSON.stringify(configuration));
      bl.lint(configuration, (bundle) => {
        const items = bundle.getReport();
        assert.ok(items);
        assert.ok(items.length);
        const actualErrors = items.filter(
          (item) => item.messages && item.messages.length
        );
        assert.ok(actualErrors.length);
        debug("actualErrors: " + util.format(actualErrors));

        // this test looks only for BN012 warnings
        const bn012Items = actualErrors.filter((e) =>
          e.messages.find((m) => m.ruleId == "BN012")
        );

        // Both target-3 and target-4 are un-referenced; target-3
        // has the disabled directive within it.
        debug("bn012Items: " + util.format(bn012Items));
        if (ignoreDirectives) {
          assert.equal(bn012Items.length, 2);
          const expectedMessageRe = new RegExp(
            "^Unreferenced TargetEndpoint target-[34]\\. There are no RouteRules that reference this TargetEndpoint.$"
          );
          bn012Items.forEach((item, ix) => {
            const bn012Messages = item.messages.filter(
              (m) => m.ruleId == "BN012"
            );
            assert.equal(bn012Messages.length, 1);

            assert.ok(
              bn012Messages[0].message.match(expectedMessageRe),
              `item(${ix}) message`
            );
          });
        } else {
          assert.equal(bn012Items.length, 1);
          assert.ok(bn012Items[0].messages);

          const bn012Messages = bn012Items[0].messages.filter(
            (m) => m.ruleId == "BN012"
          );

          assert.equal(bn012Messages.length, 1);
          assert.equal(
            bn012Messages[0].message,
            "Unreferenced TargetEndpoint target-4. There are no RouteRules that reference this TargetEndpoint."
          );
        }
      });
    })
  );
});
