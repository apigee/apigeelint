/*
  Copyright 2019 Google LLC

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

var fs = require("fs");

function Resource(parent, path, fname) {
  this.parent = parent;
  this.path = path;
  this.fname = fname;
  this.messages = { warnings: [], errors: [] };
  this.report = {
    filePath: path.substring(path.indexOf("/apiproxy")),
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
    if (!msg.severity) msg.severity = msg.plugin.severity;
    msg.nodeType = msg.plugin.nodeType;
    delete msg.plugin;
  }

  if (!msg.hasOwnProperty("entity")) {
    msg.entity = this;
  }
  if (!msg.hasOwnProperty("source") && msg.entity.hasOwnProperty("getSource")) {
    msg.source = msg.entity.getSource();
  }
  if (!msg.hasOwnProperty("line") && msg.entity.hasOwnProperty("getElement")) {
    msg.line = msg.entity.getElement().lineNumber;
  }
  if (
    !msg.hasOwnProperty("column") &&
    msg.entity.hasOwnProperty("getElement")
  ) {
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
      this.report.errorCount++;
      break;
  }
};

Resource.prototype.getReport = function() {
  return this.report;
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
