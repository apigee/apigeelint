//Policy.js

//Private
var FindFolder = require("node-find-folder"),
    fs = require("fs"),
    path = require("path"),
    Policy = require("./Policy.js"),
    xpath = require("xpath"),
    Dom = require("xmldom").DOMParser;

function Bundle(config) {
    init.config(config, this);
    //this.bundle.config = config;
}


var init = {
    config(config, bundle) {
        //lets preload the bundle structure here
        this[config.source.type](config, bundle);
    },
    filesystem(config, bundle) {
        debugger;
        process.chdir(config.source.path);

        //ok lets build our bundle representation from file system
        //note all methods ultimately will call this init
        //usually after they retrieve the bundle from a remote
        //two structures are supported
        //apiproxy at root of config.path or one level deeper
        //this will facilitate analyzing pom files as well
        bundle.root = config.source.path;
        bundle.policies = [];
        bundle.messages = { warnings: [], errors: [] };
        bundle.warn = function(msg) {
            return this.messages.warnings.push(msg);
        };
        bundle.err = function(msg) {
            return this.messages.errors.push(msg);
        }
        var folders = new FindFolder("apiproxy");

        folders.some(function(folder) {
            if (folder.indexOf("target/") === -1) {
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
    }
};

Bundle.prototype.lint = function(aconfig) {
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
            plugin.checkPolicy && bundle.checkPolicy(plugin.checkPolicy);
        });
        report(bundle);
    } catch (error) {
        console.log(error);
        console.log(getStackTrace(error));
    }
};

Bundle.prototype.checkPolicies = function(pluginFunction) {
    debugger;
    if (this.policies) {
        this.policies.forEach(pluginFunction);
    }
}

//Public
module.exports = Bundle;
