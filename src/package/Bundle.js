//Policy.js

//Private
var myUtil = require("./myUtil.js"),
    FindFolder = require("node-find-folder"),
    fs = require("fs"),
    path = require("path"),
    Step = require("./Step.js"),
    Policy = require("./Policy.js"),
    Endpoint = require("./Endpoint.js"),
    xpath = require("xpath"),
    Dom = require("xmldom").DOMParser;

function buildResources(bundle) {
    bundle.resources = [];
    //traverse the resources folders
}

function buildProxyEndpoints(bundle) {
    var folder = bundle.proxyRoot + "/proxies/",
        tag = "ProxyEndpoint",
        processFunction = function(element, fname, bundle) {
            bundle.proxyEndpoints = bundle.proxyEndpoints || [];
            bundle.proxyEndpoints.push(new Endpoint(element, bundle, fname));
        };
    myUtil.processTagsFromFolder(folder, tag, bundle, processFunction);
}

function buildTargetEndpoints(bundle) {
    var folder = bundle.proxyRoot + "/targets/",
        tag = "TargetEndpoint",
        processFunction = function(element, fname, bundle) {
            bundle.targetEndpoints = bundle.targetEndpoints || [];
            bundle.targetEndpoints.push(new Endpoint(element, bundle, fname));
        };
    myUtil.processTagsFromFolder(folder, tag, bundle, processFunction);
}

function buildPolicies(bundle) {
    //get the list of policies and create the policy objects
    var files = fs.readdirSync(bundle.proxyRoot + "/policies");
    files.forEach(function(policyFile) {
        bundle.policies.push(new Policy(bundle.proxyRoot + "/policies", policyFile));
    });
}

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

        buildPolicies(bundle);
        buildProxyEndpoints(bundle);
        buildTargetEndpoints(bundle);
    }
};

function Bundle(config) {
    init.config(config, this);
}


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
    var processSteps = function(snip, fname, bundle) {
        var step = new Step(snip, fname);
        //now populate the policies on the step
        step.policy = bundle.getPolicyByName(step.getName());
        step.policy.steps = step.policy.steps || [];
        step.policy.steps.push(step);
        bundle.steps.push(step);
    };
    this.steps = this.steps || [];
    myUtil.processTagsFromFolder(this.proxyRoot + "/proxies/", ".//Step", this, processSteps, pluginFunction);
    myUtil.processTagsFromFolder(this.proxyRoot + "/targets/", ".//Step", this, processSteps, pluginFunction);
};

Bundle.prototype.checkResources = function(pluginFunction) {

};

Bundle.prototype.checkPolicies = function(pluginFunction) {
    if (this.policies) {
        this.policies.forEach(pluginFunction);
    }
};


Bundle.prototype.checkSteps = function(pluginFunction) {
    this.getProxyEndpoints()&&this.getProxyEndpoints().forEach(function(ep) { ep.checkSteps(pluginFunction); });
    this.getTargetEndpoints()&&this.getTargetEndpoints().forEach(function(ep) { ep.checkSteps(pluginFunction); });
};

Bundle.prototype.checkConditions = function(pluginFunction) {

};

Bundle.prototype.checkProxyEndpoints = function(pluginFunction) {

};

Bundle.prototype.checkTargetEndpoints = function(pluginFunction) {

};

Bundle.prototype.getProxyEndpoints = function() {

    if (!this.proxyEndpoints) {
        buildProxyEndpoints(this);
    }
    return this.proxyEndpoints;
};

Bundle.prototype.getTargetEndpoints = function() {
    if (!this.targetEndpoints) {
        buildTargetEndpoints(this);
    }
    return this.targetEndpoints;
};

Bundle.prototype.summarize = function() {
    var summary = {
        messages: this.messages,
        root: this.root,
        policies: this.policies
    }
    summary.proxyEndpoints = [];
    if (this.getProxyEndpoints()) {
        this.getProxyEndpoints().forEach(function(ep) {
            summary.proxyEndpoints.push(ep.summarize());
        });
    }
    summary.targetEndpoints = [];
    if (this.getTargetEndpoints()) {
        this.getTargetEndpoints().forEach(function(ep) {
            summary.targetEndpoints.push(ep.summarize());
        });
    }


    return summary;
};

//Public
module.exports = Bundle;
