//Resource.js

//Private
var fs = require("fs");

function Resource(parent, path, fname) {
  this.parent = parent;
  this.path = path;
  this.fname = fname;
  this.messages = { warnings: [], errors: [] };
  this.report = {
    filePath: path,
    errorCount: 0,
    warningCount: 0,
    fixableErrorCount: 0,
    fixableWarningCount: 0,
    messages: []
  };
}

Resource.prototype.getFileName = function() {
  return this.fname;
};

Resource.prototype.getParent = function() {
  return this.parent;
};

Resource.prototype.addMessage = function(msg) {
  if (msg.hasOwnProperty("plugin")) {
    msg.ruleId = msg.plugin.ruleId;
    msg.severity = msg.plugin.severity;
    msg.nodeType = msg.plugin.nodeType;
    delete msg.plugin;
  }

  if (!msg.hasOwnProperty("entity")) {
    msg.entity = this;
  }
  if (!msg.hasOwnProperty("source")) {
    msg.source = msg.entity.getSource();
  }
  if (!msg.hasOwnProperty("line")) {
    msg.line = msg.entity.getElement().lineNumber;
  }
  if (!msg.hasOwnProperty("column")) {
    msg.column = msg.entity.getElement().columnNumber;
  }
  delete msg.entity;

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
    this.lines = this.getContents().toString().split("\n");
  }
  //check start and stop
  if (!stop || stop > this.lines.length) {
    stop = this.lines.length;
  }
  if (!start || start < 0) {
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
