//myUtil.js
var fs = require("fs"),
    xpath = require("xpath"),
    Dom = require("xmldom").DOMParser,
    util = require('util');

function rBuildTagBreadCrumb(doc, bc) {
    if (doc && doc.parentNode) {
        bc = rBuildTagBreadCrumb(doc.parentNode, doc.parentNode.nodeName + ":" + bc);
    }
    return bc;
}

function buildTagBreadCrumb(doc) {
    var result = rBuildTagBreadCrumb(doc, "");
    return rBuildTagBreadCrumb(doc, "");
}

function getFileName(obj) {
    if (obj.fileName) {
        return obj.fileName
    } else {
        return getFileName(obj.parent);
    }
}


function processTagsFromFolder(folder, tag, bundle, processFunction) {
    if (fs.existsSync(folder)) {
        var files = fs.readdirSync(folder);
        files.forEach(function(proxyFile) {
            var fname = folder + proxyFile;
            var doc = xpath.select(tag, new Dom().parseFromString(fs.readFileSync(fname).toString()));
            doc.forEach(function(element) { processFunction(element, fname, bundle); });
        });
    }
}

function print(msg) {
    try {
        if (msg && (typeof msg === "object")) {
            console.log(JSON.stringify(msg, null, 4));
        } else {
            console.log(msg);
        }
    } catch (error) {
        console.log(error);
    }
}

function inspect(obj) {
    console.log(util.inspect(obj, { showHidden: true, depth: 9, maxArrayLength: 10 }));
}

function warn(msg) {
    print(msg);
}

function debugPrint(msg) {
    if (config.debug) {
        print(msg);
    }
}

function getStackTrace(e) {
    return e.stack.replace(/^[^\(]+?[\n$]/gm, "")
        .replace(/^\s+at\s+/gm, "")
        .replace(/^Object.<anonymous>\s*\(/gm, "{anonymous}()@")
        .split("\n");
}

function getAttributeValue(attributes, name) {
    name = name.toUpperCase();
    for (var key in attributes) {
        if (attributes[key].name.toUpperCase() === name) {
            return attributes[key].value;
        }
    }
}


module.exports = {
    buildTagBreadCrumb,
    processTagsFromFolder,
    print,
    debugPrint,
    getStackTrace,
    getAttributeValue,
    inspect,
    getFileName
};
