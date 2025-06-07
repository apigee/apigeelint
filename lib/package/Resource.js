/*
  Copyright 2019-2022,2025 Google LLC

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

const fs = require("node:fs"),
  path = require("node:path"),
  lintUtil = require("./lintUtil.js");

class Resource {
  constructor(bundle, realpath, fname) {
    this.parent = bundle;
    this.path = realpath;
    this.fname = fname;
    this.bundleType = bundle.bundletype ? bundle.bundletype : "apiproxy";
    this.messages = { warnings: [], errors: [] };
    this.report = {
      //filePath: path.join(bundle.sourcePath, path.basename(fname)),
      filePath: lintUtil.effectivePath(bundle, realpath),
      errorCount: 0,
      warningCount: 0,
      fixableErrorCount: 0,
      fixableWarningCount: 0,
      messages: [],
    };
  }

  getFileName() {
    return this.fname;
  }

  getParent() {
    return this.parent;
  }

  addMessage(msg) {
    if (msg.hasOwnProperty("plugin")) {
      msg.ruleId = msg.plugin.ruleId;
      if (!msg.severity) msg.severity = msg.plugin.severity;
      msg.nodeType = msg.plugin.nodeType;
      delete msg.plugin;
    }

    if (!msg.hasOwnProperty("entity")) {
      msg.entity = this;
    }
    if (
      !msg.hasOwnProperty("source") &&
      msg.entity.hasOwnProperty("getSource")
    ) {
      msg.source = msg.entity.getSource();
    }
    if (
      !msg.hasOwnProperty("line") &&
      msg.entity.hasOwnProperty("getElement")
    ) {
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
  }

  getReport() {
    return this.report;
  }

  summarize() {
    //summary.parent = this.getParent();
    //summary.contents = this.getContents();
    return {
      fileName: this.getFileName(),
    };
  }

  getContents() {
    if (!this.contents) {
      //read the file contents and return them
      this.contents = fs.readFileSync(this.path).toString();
    }
    return this.contents;
  }

  getLines(start, stop) {
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
  }
}

//Public
module.exports = Resource;
