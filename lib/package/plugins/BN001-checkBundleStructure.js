/*
Copyright © 2019-2020, 2026 Google LLC

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

const fs = require("node:fs"),
  path = require("node:path"),
  ruleId = require("../lintUtil.js").getRuleId();

const plugin = {
  ruleId,
  name: "Bundle Structure",
  message:
    "Bundle Structure: Check bundle structure, bundles have a specific structure, extra folder or files may be problematic.",
  fatal: false,
  severity: 2, //error
  nodeType: "Bundle",
  enabled: true,
};

const eq = (lh, rh) => lh === rh;

function contains(a, obj, f) {
  if (!a || !a.length) {
    return false;
  }
  f = f || eq;

  // not the same as a.find(), though I am not sure it matters
  for (var i = 0; i < a.length; i++) {
    if (f(a[i], obj)) {
      return a[i] || true;
    }
  }
  return false;
}

function checkNode(bundle, node, curRoot) {
  //node has two arrays files and folders
  //check if files is correct
  let files,
    flagged = false;
  const compareNodeToFolder = (n, f) => n.name === f;
  const mark = (source) => {
    let msg = {
      ruleId: plugin.ruleId,
      severity: plugin.severity,
      nodeType: plugin.nodeType,
      message: source,
    };
    bundle.addMessage(msg);
    flagged = true;
  };

  try {
    files = fs.readdirSync(curRoot);
  } catch (e) {
    mark({ curRoot, error: e });
    return flagged;
  }

  if (node.folders && node.folders.length) {
    node.folders.forEach(function (folder) {
      if (folder.required && !files.includes(folder.name)) {
        mark(`Required folder "${folder.name}" not found.`);
      }
    });
  }

  // walk the folders in files
  files
    .filter((file) => file !== "node_modules")
    .forEach(function (file) {
      const stat = fs.statSync(path.join(curRoot, file));
      if (stat && stat.isDirectory()) {
        // is there a child node that matches? if not error if so recurse
        let foundNode;
        if (node.folders && node.folders.any === true) {
          //create a node that corresponds to the current node with the correct name
          foundNode = JSON.parse(JSON.stringify(node));
          foundNode.name = file;
        } else {
          foundNode = contains(node.folders, file, compareNodeToFolder);
        }
        if (foundNode) {
          flagged =
            flagged ||
            checkNode(bundle, foundNode, path.join(curRoot, foundNode.name));
        } else {
          //we may have an unknown folder
          let allowedFolders = [];
          if (node.folders) {
            allowedFolders = JSON.parse(JSON.stringify(node.folders));
            allowedFolders.forEach(function (f) {
              delete f.files;
              delete f.folders;
            });
          }

          const filepath = path.join(
            curRoot.substring(curRoot.indexOf("/apiproxy")), // Not sure about this on Windows
            file,
          );
          mark(
            `Unexpected folder found "${file}". Current root:"${filepath}"` +
              ` Valid folders: ${JSON.stringify(allowedFolders)}.`,
          );
        }
      } else if (file !== ".DS_Store" && !file.endsWith("~")) {
        // does the file extension match those valid for this node
        let extension = file.split(".");
        extension = extension.length > 1 ? extension[extension.length - 1] : "";

        if (
          node.files &&
          node.files.extensions &&
          !node.files.extensions.includes(extension)
        ) {
          const msg =
            node.files.extensions.length == 0
              ? `Unexpected file ${path.join(curRoot, file)}.`
              : `Unexpected extension found with file ${path.join(curRoot, file)}.` +
                ` Valid extensions: ${JSON.stringify(node.files.extensions)}`;
          mark(msg);
        }
      }
    });

  return flagged;
}

const bundleStructure = function (bundleType) {
  let structure = {
    name: bundleType,
    files: { extensions: ["xml", "md"], maxCount: 1 },
    folders: [
      { name: "manifests", required: false, files: { extensions: ["xml"] } },
      { name: "policies", required: false, files: { extensions: ["xml"] } },
      {
        name: "stepdefinitions",
        required: false,
        files: { extensions: ["xml"] },
      },
      {
        name: "resources",
        required: false,
        files: { extensions: [] },
        folders: [
          {
            name: "jsc",
            required: false,
            files: { extensions: ["js", "jsc", "json"] },
            folders: { any: true },
          },
          {
            name: "java",
            required: false,
            files: {
              extensions: ["jar", "zip", "properties", "inf"],
            },
            folders: { any: true },
          },
          {
            name: "py",
            required: false,
            files: {
              extensions: ["py", ""],
            },
          },
          {
            name: "xsl",
            required: false,
            files: {
              extensions: ["xslt", "xsl"],
            },
          },
          {
            name: "template",
            required: false,
            files: {
              extensions: ["tmpl", "template"],
            },
          },
          {
            name: "openapi",
            required: false,
            files: {
              extensions: ["json", "yaml"],
            },
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
                "xml",
              ],
            },
            folders: { any: true },
          },
          {
            name: "hosted",
            required: false,
            folders: { any: true },
          },
          {
            name: "wsdl",
            required: false,
            files: {
              extensions: ["wsdl"],
            },
          },
          {
            name: "xsd",
            required: false,
            files: {
              extensions: ["xsd"],
            },
          },
          {
            name: "oas",
            required: false,
            files: {
              extensions: ["json", "yaml", "yml"],
            },
          },
          {
            name: "properties",
            required: false,
            files: {
              extensions: ["properties"],
            },
          },
          {
            name: "graphql",
            required: false,
            files: {
              extensions: ["graphql"],
            },
          },
        ],
      },
    ],
  };

  if (bundleType == "apiproxy") {
    const proxies = {
      name: "proxies",
      required: true,
      files: { extensions: ["xml"] },
    };
    const targets = {
      name: "targets",
      required: false,
      files: { extensions: ["xml"] },
    };
    structure.folders.push(proxies);
    structure.folders.push(targets);

    //#361
    const integrationEndpoints = {
      name: "integration-endpoints",
      required: false,
      files: { extensions: ["xml"] },
    };
    structure.folders.push(integrationEndpoints);
  }

  if (bundleType == "sharedflowbundle") {
    const flow = {
      name: "sharedflows",
      required: true,
      files: { extensions: ["xml"] },
    };

    structure.folders.push(flow);
  }
  return structure;
};

const onBundle = function (bundle, cb) {
  const bundleStruct = bundleStructure(bundle.bundleTypeName);
  const flagged = checkNode(bundle, bundleStruct, bundle.proxyRoot);
  if (typeof cb == "function") {
    cb(null, flagged);
  }
};

module.exports = {
  plugin,
  onBundle,
};
