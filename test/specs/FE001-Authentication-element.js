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

/* global describe, it */

const ruleId = "FE001",
  assert = require("node:assert"),
  path = require("node:path"),
  util = require("node:util"),
  debug = require("debug")(`apigeelint:${ruleId}`),
  bl = require("../../lib/package/bundleLinter.js");

describe(`${ruleId} - bundle with Authentication elements`, () => {
  const profiles = ["apigee", "apigeex"];

  profiles.forEach((profile) =>
    it(`should generate the expected errors for profile ${profile}`, () => {
      const configuration = {
        debug: true,
        source: {
          type: "filesystem",
          path: path.resolve(
            __dirname,
            "../fixtures/resources/FE001-Authentication/apiproxy"
          ),
          bundleType: "apiproxy"
        },
        profile,
        excluded: {},
        setExitCode: false,
        output: () => {} // suppress output
      };

      bl.lint(configuration, (bundle) => {
        const items = bundle.getReport();
        assert.ok(items);
        assert.ok(items.length);
        const fe001Issues = items.filter(
          (item) =>
            item.messages &&
            item.messages.length &&
            item.messages.find((m) => m.ruleId == ruleId)
        );
        if (profile == "apigeex") {
          assert.equal(fe001Issues.length, 4);
          debug(util.format(fe001Issues));

          const ep2 = fe001Issues.find((e) =>
            e.filePath.endsWith("target-2.xml")
          );
          assert.ok(ep2);
          debug(util.format(ep2.messages));
          let messages = ep2.messages.filter((m) => m.ruleId == ruleId);
          assert.equal(messages.length, 1);
          assert.ok(messages[0].message);
          assert.equal(
            messages[0].message,
            "misconfigured (empty) Authentication element."
          );

          const policy1 = fe001Issues.find((e) =>
            e.filePath.endsWith("SC-2-multiple-token-nodes.xml")
          );
          assert.ok(policy1);
          debug(util.format(policy1.messages));
          messages = policy1.messages.filter((m) => m.ruleId == ruleId);
          assert.equal(messages.length, 1);
          assert.ok(messages[0].message);

          const policy2 = fe001Issues.find((e) =>
            e.filePath.endsWith("EC-2-accesstoken.xml")
          );
          assert.ok(policy2);
          debug(util.format(policy2.messages));
          messages = policy2.messages.filter((m) => m.ruleId == ruleId);

          assert.equal(messages.length, 2);
          assert.ok(messages[0].message);
          assert.ok(messages[1].message);
        } else {
          assert.equal(fe001Issues.length, 7);
          debug(util.format(fe001Issues));
          const itemsFlagged = fe001Issues.map((issue) =>
            issue.filePath.substring(issue.filePath.lastIndexOf("/") + 1)
          );
          const expectedItemsFlagged = [
            "target-1.xml",
            "target-2.xml",
            "target-3.xml",
            "SC-1-valid.xml",
            "EC-1-valid.xml",
            "EC-2-accesstoken.xml",
            "SC-2-multiple-token-nodes.xml"
          ];
          for (let i = 0; i < expectedItemsFlagged; i++) {
            assert.ok(
              itemsFlagged.includes(expectedItemsFlagged[i]),
              expectedItemsFlagged[i]
            );
          }
          assert.equal(itemsFlagged.length, expectedItemsFlagged.length);
        }
      });
    })
  );
});
