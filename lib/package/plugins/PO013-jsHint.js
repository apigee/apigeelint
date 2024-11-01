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
/* global process */

const ruleId = require("../lintUtil.js").getRuleId(),
      path = require("path"),
      fs = require("fs"),
      minimatch = require("minimatch"),
      debug = require("debug")("apigeelint:" + ruleId);

const plugin = {
    ruleId,
    name: "jsHint",
    message: "jsHint applied to all javascript resource callouts.",
    fatal: false,
    severity: 1,
    nodeType: "Resource",
    enabled: true
      };

let hadWarnErr=false;

const jshint = require("jshint"),
      jsHintCli = require("jshint/src/cli.js");

const getMessageClass = function(s) {
        if (/E\d{3}/.test(s)) return "error";
        if (/W\d{3}/.test(s)) return "warning";
        if (/I\d{3}/.test(s)) return "info";
        return "message";
      };

const cat = (file) => fs.readFileSync(file).toString('utf-8');

function findFile(name, cwd) {
  cwd = cwd || process.cwd();
  let filename = path.normalize(path.join(cwd, name));
  if (fs.existsSync(filename)) {
    return filename;
  }
  let parent = path.resolve(cwd, "../");
  if (cwd === parent) {
    return null;
  }
  return findFile(name, parent);
}

let ignores = [];

function loadIgnores(cwd) {
  let file = findFile(".jshintignore", cwd) || "";

  if (!file) {
    return [];
  }
  if (ignores[file]) {
    return ignores[file];
  }
  let lines = (file ? cat(file) : "").split("\n");
  debug("loadIgnores(): " + lines.join(', '));

  ignores[file] = lines
    .filter(line => !!line.trim() )
    .map(line => {
      if (line[0] === "!")
        return "!" + path.resolve(path.dirname(file), line.substr(1).trim());
      return path.join(path.dirname(file), line.trim());
    });
    return ignores[file];
}

const shouldIgnore = (filepath, patterns) => {
        let result = patterns.some(pattern => {
              let resolved = path.resolve(filepath);

              return (filepath === pattern) ||
            minimatch(resolved, pattern, { nocase: true, dot: true }) ||
            (fs.statSync(resolved).isDirectory() &&
             pattern.match(/^[^\/\\]*[\/\\]?$/) &&
             filepath.match(new RegExp("^" + pattern + ".*")));
            });

        debug(`shouldIgnore(${filepath}) result:` + result);
        return result;
      };


const onResource = function(resource, cb) {
  try {
    let fname = resource.getFileName();
    debug("onResource(): " + resource.path);
    if (
      fname.endsWith(".jsc") ||
      fname.endsWith(".js") ||
      fname.endsWith(".json")
    ) {
      let ignores = loadIgnores(path.dirname(resource.path));
      if ( ! shouldIgnore(resource.path, ignores)) {
        let jsHintOptions = jsHintCli.getConfig(resource.path);
        delete jsHintOptions.dirname;
        if (Object.keys(jsHintOptions).length == 0) {
          // default apigeelint options
          debug('applying default options');
          jsHintOptions = { maxerr: 50};
        }

        debug('jshint options:' + JSON.stringify(jsHintOptions));
        if ( !jshint.JSHINT(resource.getContents(), jsHintOptions) ) {
          jshint.JSHINT.errors.forEach(function(error) {
            if (error.code !== "W087") {
              var result = {
                    plugin,
                    severity: (/E\d{3}/.test(error.code)) ? 2 : 1,
                    source: error.evidence,
                    line: error.line,
                    column: error.character,
                    message: getMessageClass(error.code) + ` ${error.code}: ${error.reason}`
                  };
              resource.addMessage(result);
              hadWarnErr=true;
            }
          });
        }
      }
    }
  } catch (e) {
    debugger;
    debug("jshint error: " + e);
  }
  if (typeof cb == "function") {
    cb(null, hadWarnErr);
  }
};

module.exports = {
  plugin,
  onResource
};
