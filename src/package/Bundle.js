//Policy.js

//Private
var FindFolder = require("node-find-folder"),
    fs = require("fs"),
    path = require("path"),
    Step = require("./Step.js"),
    Policy = require("./Policy.js"),
    xpath = require("xpath"),
    Dom = require("xmldom").DOMParser;

var init = {
    config(config, bundle) {
        //lets preload the bundle structure here
        this[config.source.type](config, bundle);
    },
    filesystem(config, bundle) {
        process.chdir(config.source.path);

        //ok lets build our bundle representation from file system
        //note all methods ultimately will call this init
        //usually after they retrieve the bundle from a remote
        bundle.root = config.source.path;
        bundle.policies = [];
        bundle.messages = { warnings: [], errors: [] };
        bundle.warn = function(msg) {
            return this.messages.warnings.push(msg);
        };
        bundle.err = function(msg) {
            return this.messages.errors.push(msg);
        };
        var folders = new FindFolder("apiproxy");

        folders.some(function(folder) {
            if (folder.indexOf("target/") === -1) {
                bundle.proxyRoot = folder;
                return;
            }
        });

        //get the list of policies and create the policy objects
        var files = fs.readdirSync(bundle.proxyRoot + "/policies");
        files.forEach(function(policyFile) {
            bundle.policies.push(new Policy(bundle.proxyRoot + "/policies", policyFile));
        });
    }
};

function Bundle(config) {
    init.config(config, this);
}

Bundle.prototype.checkPolicies = function(pluginFunction) {
    if (this.policies) {
        this.policies.forEach(pluginFunction);
    }
};

Bundle.prototype.getPolicyByName = function(pname) {
    var result;
    this.policies.some(function(policy) {
        if (policy.getName() === pname) {
            result = policy;
            return true;
        }
    });
    return result;
};

Bundle.prototype.checkSteps = function(pluginFunction) {
    var bundle = this;
    if (!bundle.steps) {
        bundle.steps = [];
        //build up the steps
        //walk all the proxy files
        //get the list of policies and create the policy objects
        var files = fs.readdirSync(bundle.proxyRoot + "/proxies");
        files.forEach(function(proxyFile) {
            //read in the proxyFile
            //get the step nodes
            var fname = bundle.proxyRoot + "/proxies/" + proxyFile;
            var doc = xpath.select(".//Step", new Dom().parseFromString(fs.readFileSync(fname).toString()));

            doc.forEach(function(snip) {
                var step = new Step(snip, fname);
                //now populate the policies on the step
                step.policy = bundle.getPolicyByName(step.getName());
                step.policy.steps = step.policy.steps || [];
                step.policy.steps.push(step);
                bundle.steps.push(step);
            });
        });
        //walk all the target files
    }
    bundle.steps.forEach(pluginFunction);
}

//Public
module.exports = Bundle;
