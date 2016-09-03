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
        files: { extension: [".xml"], maxCount: 1 },
        folders: [
            { name: "policies", required: true, files: { extensions: ['.xml'] } },
            { name: "proxies", required: true, files: { extensions: ['.xml'] } },
            { name: "targets", required: true, files: { extensions: ['.xml'] } }, {
                name: "resources",
                required: true,
                folders: [{
                    name: "jsc",
                    required: false,
                    files: { extensions: ['.js', '.jsc', '.json'] }
                }, {
                    name: "node",
                    required: false,
                    files: { extensions: ['.js', '.jsc', '.json'] }
                }, {
                    name: "java",
                    required: false,
                    files: {
                        extensions: ['.jar', '.properties', '.inf']
                    },
                    folders: { any: true },
                }]
            }
        ]
    },
    fs = require("fs"),
    onBundle = function(bundle) {
        debugger;
        checkNode(bundleStructure, bundle.root + "/" + bundle.proxyRoot, bundle);
    },
    path = require('path');

function nodeHasFolder(ns, f) {
    var result = false;
    if (ns.folders) {
        ns.folders.some(function(n) {
            if (n.name === f) {
                result = true;
            }
            return result;
        });
    }
    return result;
}

function checkNode(node, root, bundle) {
    //node has two arrays files and folders
    //check if files is correct

    var files = fs.readdirSync(root);
    if (node.required && files.length === 0) {
        plugin.warning = "Required folder " + node.name + "not found."
        bundle.warn(plugin);
    }


    //walk the folders in files
    files.forEach(function(file) {
        if (fs.statSync(root + "/" + file).isDirectory()) {
            //is there a child node that matches? if not error if so recurse
            if (nodeHasFolder(node.folders, file)) {

            } else {

            }
        } else if (file !== ".DS_Store") {
            //does the file extension match those valid for this node
        }
    });

}


module.exports = {
    plugin,
    onBundle
};
