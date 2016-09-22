//bundleStructure.js

//for every policy check fileName per Apigee recommendations
//for every policy check if fileName matches policyName
//plugin methods and variables

var plugin = {
        code: "BN001",
        name: "Bundle Structure",
        description: "Check bundle structure, bundles have a specific structure, extra folder or files may be problematic."
    },
    bundleStructure = {
        name: "apiproxy",
        files: { extensions: ["xml", "md"], maxCount: 1 },
        folders: [
            { name: "policies", required: true, files: { extensions: ["xml"] } },
            { name: "stepdefinitions", required: true, files: { extensions: ["xml"] } },
            { name: "proxies", required: true, files: { extensions: ["xml", "flowfrag"] } },
            { name: "targets", required: true, files: { extensions: ["xml"] } }, {
                name: "resources",
                required: true,
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
    root,
    fs = require("fs"),
    myUtil = require("../myUtil.js"),
    onBundle = function(bundle) {
        root = bundle.root + "/" + bundle.proxyRoot;
        checkNode(bundleStructure, bundle.warn);
    },
    path = require("path"),
    debug = false;

function eq(lh, rh) {
    return lh === rh;
};

function contains(a, obj, f) {

    if (!a || !a.length) {
        console.log("error on contains call - empty or undefined array encountered - continuing anyway");
        debugger;
        return false;
    }
    if (!a || !a.length) { debugger; }
    if (!f) f = eq;
    for (var i = 0; i < a.length; i++) {
        if (f(a[i], obj)) {
            if (!a[i]) return true;
            return a[i];
        }
    }
    return false;
}

function checkNode(node, warn, curRoot) {
    //node has two arrays files and folders
    //check if files is correct
    var files;

    if (!curRoot) { curRoot = root };

    if (debug) {
        myUtil.inspect({ name: node.name, curRoot });
    }

    try {
        files = fs.readdirSync(curRoot),
            compareNodeToFolder = function(n, f) {
                return (n.name === f);
            };
    } catch (e) {
        plugin.warning = "Exception thrown in reading bundle";
        warn({ plugin, e });
        return;
    }

    if (node.required && (!files || files.length === 0)) {
        plugin.warning = "Required folder " + node.name + "not found."
        warn(plugin);
    }

    //walk the folders in files
    files.forEach(function(file) {
        if (fs.statSync(curRoot + "/" + file).isDirectory()) {
            //is there a child node that matches? if not error if so recurse
            var foundNode;
            if (!foundNode && node.folders && node.folders.any === true) {
                //create a node that corresponds to the current node with the correct name
                //insert the new node into a copy of the current node
                foundNode=JSON.parse(JSON.stringify(node));
                //newNode.folders.push({"name":file, "required": node.required, "extensions":node.extensions, "files":node.files})
                //foundNode = node;
                foundNode.name = file;
            } else {
                foundNode = contains(node.folders, file, compareNodeToFolder);
            }
            if (foundNode) {
                checkNode(foundNode, warn, curRoot + "/" + foundNode.name)
            } else {
                //we have an unknown folder
                plugin.warning = "Unexpected folder found \"" +file+"\". Current root:\""+ curRoot + "/" + file + "\". Root is \"" + root + "\". Valid folders:" + JSON.stringify(node.folders) + ".";
                warn(plugin);
            }
        } else if (file !== ".DS_Store") {
            //does the file extension match those valid for this node
            var extension = file.split(".");
            if (extension.length > 1) { extension = extension[extension.length - 1]; } else { extension = ""; }
            if (node.files && !node.files.extensions) console.log("no node.files.extensions");
            if (node.files && node.files.extensions && !contains(node.files.extensions, extension)) {
                plugin.warning = "Unexpected extension found with file \"" + curRoot + "/" + file + "\". Valid extensions: " + JSON.stringify(node.files.extensions);
                warn(plugin);
            }
        }
    });

}


module.exports = {
    plugin,
    onBundle
};
