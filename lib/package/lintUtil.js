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

const xpath = require("xpath"),
  util = require("node:util"),
  DEBUG = require("debug"),
  path = require("node:path"),
  fs = require("node:fs");

function isDirectory(spec) {
  const stats = fs.existsSync(spec) && fs.lstatSync(spec);
  return stats && stats.isDirectory();
}

function isNodeModulesDirectory(spec) {
  const isNodeModules =
    spec.endsWith("node_modules") || spec.endsWith("node_modules/");
  return isNodeModules && isDirectory(spec);
}

/* exported for testing */
function getNodeModulesPathFor() {
  const checkCandidate = (candidate) => {
    if (isNodeModulesDirectory(candidate)) {
      const p = path.join(candidate, "@xmldom/xmldom");
      return isDirectory(p) && p;
    }
  };
  const r = (acc, c) => {
    if (!acc) {
      const candidate = path.join(__dirname, c);
      return (
        checkCandidate(candidate) ||
        checkCandidate(path.join(candidate, "node_modules"))
      );
    }
    return acc;
  };
  const found = ["../..", "../../.."].reduce(r, null);
  if (!found) {
    throw new Error("cannot find node_modules");
  }
  return found;
}

function rBuildTagBreadCrumb(doc, bc) {
  if (doc && doc.parentNode) {
    bc = rBuildTagBreadCrumb(
      doc.parentNode,
      doc.parentNode.nodeName + ":" + bc,
    );
  }
  return bc;
}

function isEmpty(obj) {
  for (const prop in obj) {
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
  showHidden = !!showHidden;
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
  return (
    doc &&
    doc[0] &&
    doc[0].childNodes &&
    doc[0].childNodes[0] &&
    doc[0].childNodes[0].nodeValue
  );
}

const diagcb = (dbg, label) => (e, d) => {
  if (e) {
    dbg(`${label} message(${e})`);
    if (e.stack) dbg(e.stack);
  }
  if (typeof label == "function") {
    label = label();
  }
  //debug(`${label} result: ` + util.format(d));
  dbg(`${typeof label} ${label} done (${util.format(d)})`);
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
    const e = new Error(),
      frame = e.stack.split("\n")[2],
      arr = re1.exec(frame)[1].split(":"),
      [filename, matches] =
        arr[0].length === 1
          ? [arr[1], reWindows.exec(arr[1])]
          : [arr[0], reLinux.exec(arr[0])];

    /*
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
    return matches[1];
  } catch (e1) {
    console.error("error: " + e1);
    return "unknown";
  }
};

// const PLUGIN_FILENAME_REGEX = /^([A-Z]{2}\d{3})-[^\.]\.js/;
//
// const getRuleId = () => {
//   try {
//     const stack = new Error().stack;
//     const frames = stack.split("\n");
//     // Grab the 3rd line (caller of this function)
//     const frame = frames[2] || "";
//     // Extract everything between parentheses or after "at "
//     const pathMatch =
//       frame.match(/\((.*?):\d+:\d+\)/) || frame.match(/at (.*?):\d+:\d+/);
//     if (!pathMatch) throw new Error("Could not parse stack frame");
//     const fullPath = pathMatch[1];
//     const filename = path.basename(fullPath); // Extracts just "BN001-checkBundleStructure.js"
//     const match = filename.match(PLUGIN_FILENAME_REGEX);
//     if (!match) {
//       console.error(`For plugin file ${filename}, bad plugin filename format`);
//       process.exit(1);
//     }
//     return match[1];
//   } catch (e) {
//     console.error("error: " + e.message);
//     return "unknown";
//   }
// };

function effectivePath(bundle, fpath) {
  if (bundle && bundle.sourceType == "zip") {
    return fpath.replace(path.dirname(bundle.resolvedPath), bundle.sourcePath);
  }
  return fpath;
}

function isFullyQualified(filePath) {
  return (
    filePath.startsWith("/") || // platform independent
    (process.platform === "win32" && /^[a-zA-Z]:\\/.test(filePath)) || // begins with driveletter-colon-backslash
    /^\\/.test(filePath)
  ); // begins with backslash
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

/* exported for testing */
const xmlNodeTypeAsString = (function () {
  /*
   * In @xmldom/xmldom v0.8.x, the Node prototype holds the node type names.
   * But this prototype is not exported by default. So we need to require the
   * dom.js file within that module, to get it. This changes in xmldom v0.9.x, but
   * v.0.9.x has been in "beta" for more than a year.
   **/
  const d = DEBUG("apigeelint:xmldom");

  const xmlDomPath = getNodeModulesPathFor("@xmldom/xmldom"),
    Node = require(`${xmlDomPath}/lib/dom.js`).Node,
    keys = Object.keys(Node.prototype).filter((key) => key.endsWith("_NODE"));
  d(`keys(${keys})`);

  return (typ) => keys.find((key) => Node[key] == typ) || "unknown";
})();

const directiveRe = new RegExp("^\\s*apigeelint\\s+disable\\s?=(.+)$");
const isApigeelintDirective = (textContent) => {
  const match = directiveRe.exec(textContent);
  return match && match[1].split(",").map((s) => s.trim());
};

function findDirectives(elt, indent) {
  const xmlDomPath = getNodeModulesPathFor("@xmldom/xmldom"),
    Node = require(`${xmlDomPath}/lib/dom.js`).Node;
  const d = DEBUG("apigeelint:directives");
  if (!indent) {
    d(
      `root: (nodeType: ${elt.nodeType}, ${xmlNodeTypeAsString(
        elt.nodeType,
      )}) ${elt.nodeName}`,
    );
  }
  let acc = [];
  indent = indent || "";
  indent += "  ";
  const L = elt.childNodes.length;
  for (let ix = 0; ix < L; ix++) {
    const node = elt.childNodes.item(ix);
    d(
      `${indent}Node ${ix}: (nodeType: ${node.nodeType}, ${xmlNodeTypeAsString(
        node.nodeType,
      )}) ${node.nodeName}`,
    );
    if (node.nodeType == Node.COMMENT_NODE) {
      d(`${indent}  text: ${node.textContent}`);
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

const domOptions = (debug) => {
  return {
    // Without a domoptions, the default errorHandler for xmldom 0.8.0
    // emits statements to stderr, like so:
    //
    //  [xmldom error]  unexpected end of input
    //  @#[line : 1, col : 1]
    //  [xmldom warning]        unclosed xml attribute
    //  @#[line : 1, col : 1]
    //
    errorHandler: {
      warning: function (w) {
        debug(`xmldom warning: ${w}`);
      },
      error: function (e) {
        debug(`xmldom error: ${e}`);
      },
      fatalError: function (f) {
        throw f;
      },
    },

    // With an errorHandler, somehow the lineNumber checks don't work
    // the way one would expect, so we must define an empty locator.
    // (shrug)
    locator: {},
  };
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
  getRuleId,
  effectivePath,
  isFullyQualified,
  cyrb53,
  isEmpty,
  findDirectives,
  domOptions,
  /* exported for testing */
  getNodeModulesPathFor,
  xmlNodeTypeAsString,
};
