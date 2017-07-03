//myUtil.js
var fs = require("fs"),
  xpath = require("xpath"),
  Dom = require("xmldom").DOMParser,
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

function processTagsFromFolder(folder, tag, bundle, processFunction) {
  if (fs.existsSync(folder)) {
    var files = fs.readdirSync(folder);
    files.forEach(function(proxyFile) {
      var fname = folder + proxyFile;
      var doc = xpath.select(
        tag,
        new Dom().parseFromString(fs.readFileSync(fname).toString())
      );
      doc.forEach(function(element) {
        processFunction(element, fname, bundle);
      });
    });
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

module.exports = {
  buildTagBreadCrumb,
  processTagsFromFolder,
  print,
  getStackTrace,
  selectAttributeValue,
  selectTagValue,
  inspect,
  getFileName
};
