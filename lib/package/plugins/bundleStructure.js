//bundleStructure.js
//for every policy check fileName per Apigee recommendations
//for every policy check if fileName matches policyName
//plugin methods and variables
var root, plugin = {
    code: "BN001",
    name: "Bundle Structure",
    description: "Check bundle structure, bundles have a specific structure, extra folder or files may be problematic.",
    warnings: []
}, fs = require("fs");

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

function checkNode(node, warn, curRoot) {
    //node has two arrays files and folders
    //check if files is correct
    var files,
        compareNodeToFolder = function (n, f) {
            return (n.name === f);
        };

    if (!curRoot) { curRoot = root; }

    try {
        files = fs.readdirSync(curRoot);
    } catch (e) {
        plugin.warnings.push({ e });
        return;
    }

    if (node.folders && node.folders.length) {
        node.folders.forEach(function (folder) {
            if (folder.required && !contains(files, folder.name)) {
                plugin.warnings.push("Required folder \"" + folder.name + "\" not found.");
            }
        });
    }

    //walk the folders in files
    files.forEach(function (file) {
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
                checkNode(foundNode, warn, curRoot + "/" + foundNode.name);
            } else {
                //we have an unknown folder
                var allowedFolders = JSON.parse(JSON.stringify(node.folders));
                if (allowedFolders) { allowedFolders.forEach(function (f) { delete f.files; delete f.folders; }); }

                plugin.warnings.push("Unexpected folder found \"" + file + "\". Current root:\"" + curRoot + "/" + file + "\". Root is \"" + root + "\". Valid folders: " + JSON.stringify(allowedFolders) + ".");
            }
        } else if (file !== ".DS_Store") {
            //does the file extension match those valid for this node
            var extension = file.split(".");
            if (extension.length > 1) { extension = extension[extension.length - 1]; } else { extension = ""; }
            if (node.files && node.files.extensions && !contains(node.files.extensions, extension)) {
                plugin.warnings.push("Unexpected extension found with file \"" + curRoot + "/" + file + "\". Valid extensions: " + JSON.stringify(node.files.extensions));
            }
        }
    });
}

var bundleStructure = {
    name: "apiproxy",
    files: { extensions: ["xml", "md"], maxCount: 1 },
    folders: [
        { name: "policies", required: false, files: { extensions: ["xml"] } },
        { name: "stepdefinitions", required: false, files: { extensions: ["xml"] } },
        { name: "proxies", required: true, files: { extensions: ["xml", "flowfrag"] } },
        { name: "targets", required: false, files: { extensions: ["xml"] } },
        {
            name: "resources",
            required: false,
            folders: [{
                name: "jsc",
                required: false,
                files: { extensions: ["js", "jsc", "json"] },
                folders: { any: true }
            }, {
                name: "java",
                required: false,
                files: {
                    extensions: ["jar", "properties", "inf"]
                },
                folders: { any: true }
            }, {
                name: "py",
                required: false,
                files: {
                    extensions: ["py", ""]
                }
            }, {
                name: "xsl",
                required: false,
                files: {
                    extensions: ["xslt", "xsl"]
                }
            }, {
                name: "node",
                required: false,
                files: {
                    extensions: ["js", "jsc", "json", "zip", "png", "jpg", "jpeg", "css", "ejs", "eot", "svg", "ttf", "woff", "html", "htm"]
                },
                folders: { any: true }
            }]
        }
    ]
},
    onBundle = function (bundle) {
        plugin.warnings = [];
        root = bundle.proxyRoot;
        checkNode(bundleStructure, bundle.warn);
        if (plugin.warnings.length > 0) {
            bundle.warn(plugin);
        }
    };

module.exports = {
    plugin,
    onBundle
};
