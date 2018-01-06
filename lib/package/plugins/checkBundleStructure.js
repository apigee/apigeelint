//bundleStructure.js
//for every policy check fileName per Apigee recommendations
//for every policy check if fileName matches policyName
//plugin methods and variables

var bundle,
  root,
  plugin = {
    ruleId: "BN001",
    name: "Bundle Structure",
    message:
      "Bundle Structure: Check bundle structure, bundles have a specific structure, extra folder or files may be problematic.",
    fatal: false,
    severity: 2, //error
    nodeType: "Bundle",
    enabled: true
  },
  fs = require("fs"),
  hadWarnErr = false;

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
  files.forEach(function(file) {
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
    } else if (file !== ".DS_Store") {
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

var bundleStructure = {
    name: "apiproxy",
    files: { extensions: ["xml", "md"], maxCount: 1 },
    folders: [
      { name: "policies", required: false, files: { extensions: ["xml"] } },
      {
        name: "stepdefinitions",
        required: false,
        files: { extensions: ["xml"] }
      },
      {
        name: "proxies",
        required: true,
        files: { extensions: ["xml", "flowfrag"] }
      },
      { name: "targets", required: false, files: { extensions: ["xml"] } },
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
            name: "openapi",
            required: false,
            files: {
              extensions: ["json"]
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
                "htm"
              ]
            },
            folders: { any: true }
          }
        ]
      }
    ]
  },
  onBundle = function(b, cb) {
    bundle = b;
    root = bundle.proxyRoot;
    checkNode(bundleStructure);
    if (typeof cb == "function") {
      cb(null, hadWarnErr);
    }
  };

module.exports = {
  plugin,
  onBundle
};
