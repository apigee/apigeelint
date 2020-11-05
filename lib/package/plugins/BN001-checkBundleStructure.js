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

//bundleStructure.js
//for every policy check fileName per Apigee recommendations
//for every policy check if fileName matches policyName
//plugin methods and variables

const fs = require("fs"),
      ruleId = require("../myUtil.js").getRuleId();

const plugin = {
    ruleId,
    name: "Bundle Structure",
    message:
      "Bundle Structure: Check bundle structure, bundles have a specific structure, extra folder or files may be problematic.",
    fatal: false,
    severity: 2, //error
    nodeType: "Bundle",
    enabled: true
  };

let bundle,
    hadWarnErr = false,
    root;

function eq(lh, rh) {
  return lh === rh;
}

function contains(a, obj, f) {
  if (!a || !a.length) {
    return false;
  }
  f = f || eq;
  for (var i = 0; i < a.length; i++) {
    if (f(a[i], obj)) {
      if (!a[i]) {
        return true;
      }
      return a[i];
    }
  }
  return false;
}

function mark(source) {
  var result = {
    ruleId: plugin.ruleId,
    severity: plugin.severity,
    nodeType: plugin.nodeType,
    message: source
  };
  bundle.addMessage(result);
  hadWarnErr = true;
}

function checkNode(node, curRoot) {
  //node has two arrays files and folders
  //check if files is correct
  var files,
    compareNodeToFolder = function(n, f) {
      return n.name === f;
    };

  if (!curRoot) {
    curRoot = root;
  }

  try {
    files = fs.readdirSync(curRoot);
  } catch (e) {
    mark({ curRoot, error: e });
    return;
  }

  if (node.folders && node.folders.length) {
    node.folders.forEach(function(folder) {
      if (folder.required && !contains(files, folder.name)) {
        mark('Required folder "' + folder.name + '" not found.');
      }
    });
  }
  //walk the folders in files
  files.filter(file => file !== 'node_modules').forEach(function(file) {
    if (fs.statSync(curRoot + "/" + file).isDirectory()) {
      //is there a child node that matches? if not error if so recurse
      var foundNode;
      if (!foundNode && node.folders && node.folders.any === true) {
        //create a node that corresponds to the current node with the correct name
        foundNode = JSON.parse(JSON.stringify(node));
        foundNode.name = file;
      } else {
        foundNode = contains(node.folders, file, compareNodeToFolder);
      }
      if (foundNode) {
        checkNode(foundNode, curRoot + "/" + foundNode.name);
      } else {
        //we may have an unknown folder
        var allowedFolders = [];
        if (node.folders) {
          allowedFolders = JSON.parse(JSON.stringify(node.folders));
          allowedFolders.forEach(function(f) {
            delete f.files;
            delete f.folders;
          });
        }

        mark(
          'Unexpected folder found "' +
            file +
            '". Current root:"' +
            curRoot.substring(curRoot.indexOf("/apiproxy")) +
            "/" +
            file +
            '". Valid folders: ' +
            JSON.stringify(allowedFolders) +
            "."
        );
      }
    } else if (file !== ".DS_Store" && !file.endsWith('~')) {
      //does the file extension match those valid for this node
      var extension = file.split(".");
      if (extension.length > 1) {
        extension = extension[extension.length - 1];
      } else {
        extension = "";
      }
      if (
        node.files &&
        node.files.extensions &&
        !contains(node.files.extensions, extension)
      ) {
        mark(
          'Unexpected extension found with file "' +
            curRoot +
            "/" +
            file +
            '". Valid extensions: ' +
            JSON.stringify(node.files.extensions)
        );
      }
    }
  });
}

const bundleStructure = function (bundleType) {
  var structure = {
    name: bundleType,
    files: { extensions: ["xml", "md"], maxCount: 1 },
    folders: [
          { name: "manifests", required: false, files: { extensions: ["xml"] } },
      { name: "policies", required: false, files: { extensions: ["xml"] } },
      {
        name: "stepdefinitions",
        required: false,
        files: { extensions: ["xml"] }
      },
      {
        name: "resources",
        required: false,
        folders: [
          {
            name: "jsc",
            required: false,
            files: { extensions: ["js", "jsc", "json"] },
            folders: { any: true }
          },
          {
            name: "java",
            required: false,
            files: {
              extensions: ["jar", "zip", "properties", "inf"]
            },
            folders: { any: true }
          },
          {
            name: "py",
            required: false,
            files: {
              extensions: ["py", ""]
            }
          },
          {
            name: "xsl",
            required: false,
            files: {
              extensions: ["xslt", "xsl"]
            }
          },
          {
            name: "template",
            required: false,
            files: {
              extensions: ["tmpl", "template"]
            }
          },
          {
            name: "openapi",
            required: false,
            files: {
              extensions: ["json", "yaml"]
            }
          },
          {
            name: "node",
            required: false,
            files: {
              extensions: [
                "js",
                "jsc",
                "json",
                "zip",
                "png",
                "jpg",
                "jpeg",
                "css",
                "ejs",
                "eot",
                "svg",
                "ttf",
                "woff",
                "html",
                "htm",
                "xml"
              ]
            },
            folders: { any: true }
          },
          {
            name: "hosted",
            required: false,
            folders: { any: true }
          },
          {
            name: "wsdl",
            required: false,
            files: {
              extensions: ["wsdl"]
            }
          }
        ]
      }
    ]
  }

  if (bundleType == "apiproxy") {
    var proxy = {
      name: "proxies",
      required: true,
      files: { extensions: ["xml", "flowfrag"] }
    }

    var targets = { name: "targets", required: false, files: { extensions: ["xml"] } }

    structure.folders.push(proxy);
    structure.folders.push(targets);
  }

  if(bundleType == "sharedflowbundle"){
    var flow = {
      name: "sharedflows",
      required: true,
      files: { extensions: ["xml"] }
    }

    structure.folders.push(flow);
  }

  return structure;
    };

const onBundle = function (b, cb) {
        bundle = b;
        root = bundle.proxyRoot;
        let bundleStruct = bundleStructure(bundle.bundleTypeName);

        checkNode(bundleStruct);
        if (typeof cb == "function") {
          cb(null, hadWarnErr);
        }
      };

module.exports = {
  plugin,
  onBundle
};
