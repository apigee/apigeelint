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

let xpath = require("xpath"),
    util = require("util");

function rBuildTagBreadCrumb(doc, bc) {
  if (doc && doc.parentNode) {
    bc = rBuildTagBreadCrumb(
      doc.parentNode,
      doc.parentNode.nodeName + ":" + bc
    );
  }
  return bc;
}

function buildTagBreadCrumb(doc) {
  return rBuildTagBreadCrumb(doc, "");
}

function getFileName(obj) {
  if (!obj) {
    return "filename undefined";
  }
  if (obj.fileName) {
    return obj.fileName;
  } else {
    return getFileName(obj.parent);
  }
}

function print(msg) {
  try {
    if (msg && typeof msg === "object") {
      console.log(JSON.stringify(msg, null, 4));
    } else {
      console.log(msg);
    }
  } catch (error) {
    console.log(error);
  }
}

function inspect(obj, showHidden) {
  showHidden = showHidden && true;
  console.log(util.inspect(obj, { showHidden, depth: 9, maxArrayLength: 100 }));
}

function getStackTrace(e) {
  return e.stack
    .replace(/^[^\(]+?[\n$]/gm, "")
    .replace(/^\s+at\s+/gm, "")
    .replace(/^Object.<anonymous>\s*\(/gm, "{anonymous}()@")
    .split("\n");
}

function selectAttributeValue(item, path) {
  var attr = xpath.select(path, item);
  return (attr[0] && attr[0].value) || "";
}

function selectTagValue(item, path) {
  var doc = xpath.select(path, item.getElement());
  return doc && doc[0] && doc[0].childNodes && doc[0].childNodes[0].nodeValue;
}

const diagcb = (dbg, label) =>
    (e, d) => {
      if (e) {
        dbg(`${label} message(${e})`);
        if (e.stack)
          dbg(e.stack);
      }
      //debug(`${label} result: ` + util.format(d));
      dbg(`${label} done (${d})`);
    };

// return a curried function with the left-most argument filled
const curry = (fn, arg1) =>
   (...arguments) => fn.apply(this,[arg1].concat(arguments));

const re1 = new RegExp('^.+\\((.+)\\)$');
const reLinux = new RegExp('^/.+/([A-Z]{2}[0-9]{3})-(.+)$');
const reWindows = new RegExp('^\.+\([A-Z]{2}[0-9]{3})-(.+)$');
const getRuleId = () => {
        try {
          let e = new Error();
          let frame = e.stack.split("\n")[2];
          let arr = re1.exec(frame)[1].split(':');
          var matches, filename;
          if( arr[0].length == 1 ) { // Assume Windows with frame like: (C:\path\BN001-filename.js:NN:NN)
            filename = arr[1];
            matches = reWindows.exec(filename);
          } else {
            filename = arr[0];
            matches = reLinux.exec(filename);
          }
          /* 
          console.log( "frame: " + frame);
          console.log( "filename: " + filename );
          console.log( "matches: " + matches);
          Linux
          frame:     at Object.<anonymous> (/usr/local/lib/node_modules/apigeelint/lib/package/plugins/BN001-checkBundleStructure.js:23:40)
          filename: /usr/local/lib/node_modules/apigeelint/lib/package/plugins/BN001-checkBundleStructure.js
          matches: /usr/local/lib/node_modules/apigeelint/lib/package/plugins/BN001-checkBundleStructure.js,BN001,checkBundleStructure.js
          Windows Azure DevOps
          frame:     at Object.<anonymous> (D:\a\1\s\lib\package\plugins\BN001-checkBundleStructure.js:23:40)
          filename: \a\1\s\lib\package\plugins\BN001-checkBundleStructure.js
          matches: \a\1\s\lib\package\plugins\BN001-checkBundleStructure.js,BN001,checkBundleStructure.js
          */
          if ( ! matches) {
            console.error(`For plugin file ${filename}, bad plugin filename format`);
            process.exit(1);
          }
          let ruleId = matches[1];
          return ruleId;
        }catch (e1) {
          console.log('error: ' + e1);
          return "unknown";
        }
      };

module.exports = {
  buildTagBreadCrumb,
  print,
  getStackTrace,
  selectAttributeValue,
  selectTagValue,
  inspect,
  getFileName,
  curry,
  diagcb,
  getRuleId
};
