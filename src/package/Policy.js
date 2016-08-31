//Policy.js

//Private
var fs = require("fs"),
    xpath = require("xpath"),
    Dom = require("xmldom").DOMParser;

function Policy(path, fn, parent) {
    this.fileName = fn;
    this.filePath = path + "/" + fn;
    this.parent = parent;
    this.messages = { warnings: [], errors: [] };
}

Policy.prototype.getName = function() {
    if (!this.name) {
        var attr = xpath.select("//@name", this.getElement());
        this.name = attr[0] && attr[0].value || "";
    }
    return this.name;
};

Policy.prototype.getDisplayName = function() {
    if (!this.displayName) {
        var doc = xpath.select("//DisplayName", this.getElement());
        this.displayName = doc[0].childNodes[0].nodeValue;
    }
    return this.displayName;
};

Policy.prototype.select = function(xs) {
    return xpath.select(xs, this.getElement());
};

Policy.prototype.getElement = function() {
    //read the contents of the file and return it raw
    if (!this.element) {
        this.element = new Dom().parseFromString(fs.readFileSync(this.filePath).toString());
    }
    return this.element;
};

Policy.prototype.getFileName = function() {
    return this.fileName;
};

Policy.prototype.getType = function() {
    if (!this.type) {
        var doc = xpath.select("/", this.getElement());
        this.type = doc && doc[0] && doc[0].documentElement.tagName || "";
    }
    return this.type;
};

Policy.prototype.warn = function(msg) {
    return this.messages.warnings.push(msg);
};

Policy.prototype.err = function(msg) {
    return this.messages.errors.push(msg);
};

Policy.prototype.getMessages = function() {
    return this.messages;
};

Policy.prototype.getSteps = function() {
    if (!this.steps) {
        if (this.parent) {
            var policyName = this.getName(),
                steps = [];
            //bundle -> endpoints -> flows -> flowphases -> steps.getName()
            this.parent.getEndpoints().forEach(function(ep) {
                ep.getAllFlows().forEach(function(fl) {
                    var fps = [fl.getFlowRequest()];
                    fps.concat(fl.getFlowResponse());
                    fps.forEach(function(fp) {
                        fp.getSteps().forEach(function(st) {
                            if (st.getName() === policyName) {
                                steps.push(st);
                            }
                        });
                    });
                });
            });
            this.steps = steps;
        } else { this.steps = ["no parent to parse for steps"]; }
    }
    return this.steps;
};

Policy.prototype.summarize = function() {
    var summary = {};
    summary.name = this.getName();
    summary.displayName = this.getDisplayName();
    summary.fileName = this.fileName;
    summary.filePay = this.filePath;
    summary.type = this.getType();
    summary.steps = [];
    this.getSteps().forEach(function(step) {
        summary.steps.push(step.summarize());
    });
    return summary;
};

//Public
module.exports = Policy;
