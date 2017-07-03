//Resource.js

//Private
var fs = require("fs");

function Resource(parent, path, fname) {
  this.parent = parent;
  this.path = path;
  this.fname = fname;
  this.messages = { warnings: [], errors: [] };
  this.report = {
    filePath: this.fname,
    errorCount: 0,
    warningCount: 0,
    fixableErrorCount: 0,
    fixableWarningCount: 0,
    messages: []
  };
  this.report.source = this.getContents();
}

Resource.prototype.getFileName = function() {
  return this.fname;
};

Resource.prototype.getParent = function() {
  return this.parent;
};

Resource.prototype.addMessage = function(msg) {
  this.report.messages.push(msg);
  //Severity should be one of the following: 0 = off, 1 = warning, 2 = error
  switch (msg.severity) {
    case 1:
      this.report.warningCount++;
      break;
    case 2:
      this.report.warningCount++;
      break;
  }
};

Resource.prototype.getReport = function() {
  return this.report;
};

Resource.prototype.addMessage = function(msg) {
  this.parent.addMessage(msg);
};

Resource.prototype.onResources = function(pluginFunction) {
  pluginFunction(this);
};

Resource.prototype.summarize = function() {
  var summary = {};
  summary.fileName = this.getFileName();
  //summary.parent = this.getParent();
  //summary.contents = this.getContents();
  return summary;
};

Resource.prototype.getContents = function() {
  if (!this.contents) {
    //read the file contents and return them
    this.contents = fs.readFileSync(this.path).toString();
  }
  return this.contents;
};

Resource.prototype.getLines = function(start, stop) {
  //actually parse the source into lines if we haven't already and return the requested subset
  var result = "";
  if (!this.lines) {
    this.lines = fs.readFileSync(this.getFileName()).toString().split("\n");
  }
  //check start and stop
  if (start > this.lines.length) {
    start = lines.length;
  }
  if (start < 0) {
    start = 0;
  }
  if (stop > this.lines.length) {
    stop = this.lines.length;
  }
  if (stop < 0) {
    stop = 0;
  }
  if (start > stop) {
    start = stop;
  }

  for (var i = start; i <= stop; i++) {
    result += this.lines[i] + "\n";
  }

  return result;
};

//Public
module.exports = Resource;
