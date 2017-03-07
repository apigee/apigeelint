//Resource.js

//Private
var fs = require("fs");

function Resource(parent, path, fname) {
    this.parent = parent;
    this.path = path;
    this.fname = fname;
    this.messages = { warnings: [], errors: [] };
}

Resource.prototype.getFileName = function () {
    return this.fname;
};

Resource.prototype.getParent = function () {
    return this.parent;
};

Resource.prototype.warn = function (msg) {
    this.parent.warn(msg);
};

Resource.prototype.err = function (msg) {
    this.parent.err(msg);
};

Resource.prototype.onResources = function (pluginFunction) {
    pluginFunction(this);
};

Resource.prototype.summarize = function () {
    var summary = {};
    summary.fileName = this.getFileName();
    //summary.parent = this.getParent();
    //summary.contents = this.getContents();
    return summary;
};

Resource.prototype.getContents = function () {
    if (!this.contents) {
        //read the file contents and return them
        this.contents = fs.readFileSync("./" + this.path).toString();
    }
    return this.contents;
};


//Public
module.exports = Resource;
