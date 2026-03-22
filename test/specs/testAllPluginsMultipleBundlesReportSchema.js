/*
  Copyright © 2019-2022, 2026 Google LLC

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

const assert = require("node:assert"),
  path = require("node:path"),
  schema = require("../fixtures/reportSchema.js"),
  Validator = require("jsonschema").Validator,
  findFolders = require("../fixtures/findFolders.js"),
  Bundle = require("../../lib/package/Bundle.js"),
  bl = require("../../lib/package/bundleLinter.js"),
  rootDir = path.resolve(__dirname, "../fixtures/resources");

describe(`Report Schema`, () => {
  const allProxyFolders = findFolders(rootDir, "apiproxy");
  it(`checks that there are the expected proxy folders`, function () {
    assert.ok(allProxyFolders);
    assert.ok(allProxyFolders.length > 48);
  });

  allProxyFolders.forEach((folder, _ix) => {
    const shortFolder = folder.replace(
      rootDir,
      "...",
      // path.normalize("../fixtures/resources"),
    );
    it(`checks all plugins for proxy ${shortFolder}`, function () {
      this.timeout(30000);
      this.slow(10000);
      const config = {
        debug: true,
        source: {
          type: "filesystem",
          path: folder,
          bundleType: "apiproxy",
        },
        formatter: "table.js",
      };
      const bundle = new Bundle(config);
      const allPlugins = bl.listPlugins();
      assert.ok(allPlugins && allPlugins.length > 50);
      allPlugins.forEach((pluginName) => {
        if (bl.resolvePlugin(pluginName)) {
          bl.executePlugin(pluginName, bundle);
          bundle.getReport((report) => {
            const jsimpl = bl.getFormatter("json.js"),
              v = new Validator(),
              validationResult = v.validate(JSON.parse(jsimpl(report)), schema);
            assert.equal(
              validationResult.errors.length,
              0,
              validationResult.errors,
            );
          });
        }
      });
    });
  });
});
