/*
  Copyright 2019-2022 Google LLC

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
      fs = require("node:fs"),
      path = require("node:path"),
      schema = require("./../fixtures/reportSchema.js"),
      Validator = require("jsonschema").Validator,
      findFolders = require(path.join(__dirname, "../../lib/package/findFolders.js")),
      Bundle = require("../../lib/package/Bundle.js"),
      bl = require("../../lib/package/bundleLinter.js"),
      rootDir = path.resolve(__dirname, '../fixtures/resources');

describe(`Report Schema`, () => {

  let apiproxyFolders = findFolders(rootDir, "apiproxy");

  apiproxyFolders
    .forEach( (folder, ix) => {
      let shortFolder = folder.replace(rootDir, '../fixtures/resources');
      describe(`Reports for proxy ${shortFolder}`, () => {
        let config = {
              debug: true,
              source: {
                type: "filesystem",
                path: folder,
                bundleType: "apiproxy"
              },
              formatter: "table.js"
            };
        let bundle = new Bundle(config);

        return bl.listPlugins()
          .forEach(pluginName => {
            let fqPluginPath = bl.resolvePlugin(pluginName);
            if (fqPluginPath) {
              let parts = pluginName.split('-');
              it(`plugin ${parts[0]}`, () => {
                bl.executePlugin(pluginName, bundle);
                bundle.getReport(report => {
                  let jsimpl = bl.getFormatter("json.js"),
                  v = new Validator(),
                      validationResult = v.validate(JSON.parse(jsimpl(report)), schema);
                  assert.equal(
                    validationResult.errors.length,
                    0,
                    validationResult.errors
                  );
                });
              });
            }
          });
      });
    });
});
