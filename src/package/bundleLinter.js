//bundleLinter.js
var findfolder = require('node-find-folder'),
    fs = require("fs"),
    path = require("path"),
    Policy = require('./Policy.js');

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
//break down into a series of rules modules for
//bundles
//policies
//resources

//execute with a config object that controls what runs
//the reporter implementation
//the input implementation (files system, GIT, or org/env/api/rev on Edge, eventually codacy)

//define the bundle
//bundle will contain precalculated values including arrays of policies by name and type with paths as state - we won't hold full values of the policies however


var config = {};

function report(b) {
    b.policies.forEach(function(policy) {
        if (policy.messages) {
            print(policy.getFileName());
            print("-----------");
            print(policy.getMessages());
            print("");
        }
    });
}

var lint = function(aconfig) {
    //the config
    try {
        config = aconfig;
        var bundle = init.config(config);
        //for each plugin
        var normalizedPath = path.join(__dirname, "plugins");
        fs.readdirSync(normalizedPath).forEach(function(file) {
            var plugin = require("./plugins/" + file);
            //lets see if this really is a plugin
            plugin.checkBundle && plugin.checkBundle(bundle);
            plugin.checkPolicy && bundle.policies.forEach(plugin.checkPolicy);
        });
    } catch (error) {
        console.log(error);
        console.log(getStackTrace(error));
    }
    report(bundle);
}

var init = {
    config: function(config) {
        //lets preload the bundle structure here
        var bundle = this[config.source.type](config);
        return bundle;
    },
    filesystem: function(config) {
        process.chdir(config.source.path);

        //ok lets build our bundle representation from file system
        //note all methods ultimately will call this init
        //usually after they retrieve the bundle from a remote
        //two structures are supported
        //apiproxy at root of config.path or one level deeper
        //this will facilitate analyzing pom files as well
        var bundle = {
                root: config.source.path,
                policies: [],
                result: { messages: [] }
            },
            folders = new findfolder('apiproxy');

        folders.some(function(folder) {
            if (folder.indexOf('target/') === -1) {
                bundle.proxyRoot = folder;
                return;
            }
        });

        //get the list of policies and create the policy objects
        try {
            var files = fs.readdirSync(bundle.proxyRoot + "/policies");
            files.forEach(function(policyFile) {
                bundle.policies.push(new Policy(bundle.proxyRoot + "/policies", policyFile));
            });
        } catch (error) {
            console.log(error);
        }
        return bundle;
    }
}

module.exports = {
    lint,
    warn
};
