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
  fs = require("node:fs"),
  path = require("node:path"),
  tmp = require("tmp");

let tmpConfigPath;
const dirsRequiringDefaultConfig = {};

const createDefaultConfig = () => {
  if (!tmpConfigPath) {
    const tmpDir = tmp.dirSync({ unsafeCleanup: true });
    tmpConfigPath = path.join(tmpDir.name, "eslint.default.config.mjs");

    const content = `export default [
    {
      languageOptions: {
        ecmaVersion: 5,
        sourceType: 'script',
        globals: {
          print: 'readonly',
          sync: 'readonly'
        }
      },
      rules: {
        "no-var": "off",
        "prefer-arrow-callback": "off",
        "object-shorthand": "off",
        semi: "error",
        quotes: ["error", "double"],
        "quote-props": ["error", "as-needed"],
        "strict": ["error", "function"]
      }
    }
];
`;
    fs.writeFileSync(tmpConfigPath, content, "utf8");
  }
  return tmpConfigPath;
};

const configForDir = (containingDir) => {
  if (dirsRequiringDefaultConfig[containingDir]) {
    return ["-c", tmpConfigPath];
  }
  return [];
};

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
      const eslintJs = path.join(
        __dirname,
        "../../../node_modules/eslint/bin/eslint.js",
      );
      debug("eslint: " + eslintJs);
      if (!fs.existsSync(eslintJs)) {
        resource.addMessage({
          plugin,
          severity: 2,
          message: `ESLint execution error: eslint not found`,
        });
        flagged = true;
      } else {
        const containingDir = path.dirname(resource.path);
        const eslintRetry = !resource.parent.config.po025NoRetry;
        const spawnArgs = [
          eslintJs,
          "--format",
          "json",
          ...(eslintRetry ? configForDir(containingDir) : []),
          resource.path,
        ];
        let result = cp.spawnSync("node", spawnArgs, {
          encoding: "utf8",
        });

        if (
          eslintRetry &&
          !result.error &&
          result.status !== 0 &&
          result.status !== 1
        ) {
          if (
            result.stderr &&
            result.stderr.includes("couldn't find an eslint.config.")
          ) {
            debug(
              "eslint could not find an eslint.config, retrying with a default...",
            );
            createDefaultConfig();
            dirsRequiringDefaultConfig[containingDir] = true;
            const retryArgs = [
              eslintJs,
              "--format",
              "json",
              "-c",
              tmpConfigPath,
              resource.path,
            ];
            result = cp.spawnSync("node", retryArgs, {
              encoding: "utf8",
            });
          }
        }

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
          debug(result.stderr);
          let message = result.stderr;
          if (message) {
            message = message.trim();
            const cuteEslintErrorMessagePrefix =
              "Oops! Something went wrong! :(";
            // eslint prepends the message with the above, when there is no config file.
            if (message.startsWith(cuteEslintErrorMessagePrefix)) {
              message = message
                .substring(cuteEslintErrorMessagePrefix.length)
                .trim();
            }
          }
          resource.addMessage({
            plugin,
            severity: 2,
            message:
              message || `ESLint returned error status ${result.status}.`,
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
