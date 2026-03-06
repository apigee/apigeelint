/*
  Copyright © 2019-2026 Google LLC

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

const ruleId = require("../lintUtil.js").getRuleId(),
  debug = require("debug")("apigeelint:" + ruleId),
  cp = require("node:child_process"),
  path = require("node:path");

const plugin = {
  ruleId,
  name: "esLint",
  message: "esLint applied to all javascript resources.",
  fatal: false,
  severity: 1,
  nodeType: "Resource",
  enabled: true,
};

const onResource = function (resource, cb) {
  let flagged = false;
  try {
    let fname = resource.getFileName();
    if (fname.endsWith(".jsc") || fname.endsWith(".js")) {
      const eslintBin = path.join(
        __dirname,
        "../../../node_modules/.bin/eslint",
      );
      debug("eslint: " + eslintBin);
      const result = cp.spawnSync(eslintBin, ["--format", "json", resource.path], {
        encoding: "utf8",
      });

      if (result.error) {
        debug(`eslint error: ${result.error}`);
        resource.addMessage({
          plugin,
          severity: 2,
          message: `ESLint execution error: ${result.error.message}`,
        });
        flagged = true;
      } else if (result.status !== 0 && result.status !== 1) {
        debug(`eslint returned error status ${result.status}`);
        let message = result.stderr;
        if (message) {
          message = message.trim();
          const cuteEslintErrorMessagePrefix = "Oops! Something went wrong! :(";
          if (message.startsWith(cuteEslintErrorMessagePrefix)) {
            message = message
              .substring(cuteEslintErrorMessagePrefix.length)
              .trim();
          }
        }
        resource.addMessage({
          plugin,
          severity: 2,
          message: message
            ? message
            : `ESLint returned error status ${result.status}.`,
        });
        flagged = true;
      }

      if (result.stderr && !result.error && result.status <= 1) {
        debug(`eslint stderr: ${result.stderr}`);
      }

      if (result.stdout) {
        const results = JSON.parse(result.stdout);
        if (results && results.length > 0 && results[0].messages) {
          results[0].messages.forEach((item) => {
            debug("item:" + JSON.stringify(item));
            let result = {
              plugin,
              severity: item.severity,
              line: item.line,
              column: item.column,
              message:
                item.ruleId +
                ": " +
                (item.nodeType || "unknown") +
                ": " +
                item.message,
            };
            debug("result:" + JSON.stringify(result));
            resource.addMessage(result);
            flagged = true;
          });
        }
      }
    }
  } /* c8 ignore start */ catch (e) {
    debug("eslint error" + e);
  } /* c8 ignore stop */
  if (typeof cb == "function") {
    cb(null, flagged);
  }
};

module.exports = {
  plugin,
  onResource,
};
