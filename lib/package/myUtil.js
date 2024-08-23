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

let xpath = require("xpath"),
  util = require("util"),
  debug = require("debug");

function rBuildTagBreadCrumb(doc, bc) {
  if (doc && doc.parentNode) {
    bc = rBuildTagBreadCrumb(
      doc.parentNode,
      doc.parentNode.nodeName + ":" + bc
    );
  }
  return bc;
}

function isEmpty(obj) {
  for (var prop in obj) {
    if (obj.hasOwnProperty(prop)) return false;
  }

  return true;
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
  const attr = xpath.select(path, item.getElement());
  return (attr[0] && attr[0].value) || "";
}

function selectTagValue(item, path) {
  const doc = xpath.select(path, item.getElement());
  return doc && doc[0] && doc[0].childNodes && doc[0].childNodes[0].nodeValue;
}

const diagcb = (dbg, label) => (e, d) => {
  if (e) {
    dbg(`${label} message(${e})`);
    if (e.stack) dbg(e.stack);
  }
  //debug(`${label} result: ` + util.format(d));
  dbg(`${label} done (${d})`);
};

// return a curried function with the left-most argument filled
const curry =
  (fn, arg1) =>
  (...arguments) =>
    fn.apply(this, [arg1].concat(arguments));

const re1 = new RegExp("^.+\\((.+)\\)$");
const reLinux = new RegExp("^/.+/([A-Z]{2}[0-9]{3})-(.+)$");
const reWindows = new RegExp("^.+([A-Z]{2}[0-9]{3})-(.+)$");
const getRuleId = () => {
  try {
    let e = new Error();
    let frame = e.stack.split("\n")[2];
    let arr = re1.exec(frame)[1].split(":");
    var matches, filename;
    if (arr[0].length == 1) {
      // Assume Windows with frame like: (C:\path\BN001-filename.js:NN:NN)
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
    if (!matches) {
      console.error(`For plugin file ${filename}, bad plugin filename format`);
      process.exit(1);
    }
    let ruleId = matches[1];
    return ruleId;
  } catch (e1) {
    console.log("error: " + e1);
    return "unknown";
  }
};

function effectivePath(root, bundleTypeName) {
  return root;
  // // will this work on Windows?
  // return root.substring(root.lastIndexOf("/" + bundleTypeName) + 1);
}

//Courtesy - https://stackoverflow.com/a/52171480
const cyrb53 = (str, seed = 0) => {
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }

  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

const NodeType = {
  ELEMENT_NODE: 1,
  ATTRIBUTE_NODE: 2,
  TEXT_NODE: 3,
  CDATA_SECTION_NODE: 4,
  ENTITY_REFERENCE_NODE: 5,
  ENTITY_NODE: 6,
  PROCESSING_INSTRUCTION_NODE: 7,
  COMMENT_NODE: 8,
  DOCUMENT_NODE: 9,
  DOCUMENT_TYPE_NODE: 10,
  DOCUMENT_FRAGMENT_NODE: 11,
  NOTATION_NODE: 12
};
const nodeTypeAsString = (t) => {
  const keys = Object.keys(NodeType);
  for (let ix = 0; ix < keys.length; ix++) {
    if (NodeType[keys[ix]] == t) {
      return keys[ix];
    }
  }
  return "unknown";
};

const directiveRe = new RegExp("^\\s*apigeelint\\s+disable\\s?=(.+)$");
const isApigeelintDirective = (textContent) => {
  const match = directiveRe.exec(textContent);
  if (match) {
    return match[1].split(",").map((s) => s.trim());
  }
};

function findDirectives(elt, indent) {
  if (!indent) {
    debug("apigeelint:findDirectives")(
      `root: ${nodeTypeAsString(elt.nodeType)} ${elt.nodeName}`
    );
  }
  let acc = [];
  indent = indent || "";
  indent += "  ";
  const L = elt.childNodes.length;
  for (let ix = 0; ix < L; ix++) {
    const node = elt.childNodes.item(ix);
    debug("apigeelint:findDirectives")(
      `${indent}Node ${ix}: ${nodeTypeAsString(node.nodeType)} ${node.nodeName}`
    );
    if (node.nodeType == NodeType.COMMENT_NODE) {
      debug("apigeelint:findDirectives")(
        `${indent}  text: ${node.textContent}`
      );
      const disable = isApigeelintDirective(node.textContent);
      if (disable) {
        acc.push({ disable, line: node.lineNumber });
      }
    }
    if (node.hasChildNodes()) {
      acc = acc.concat(findDirectives(node, indent));
    }
  }
  return acc;
}

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
  getRuleId,
  effectivePath,
  cyrb53,
  isEmpty,
  findDirectives
};
