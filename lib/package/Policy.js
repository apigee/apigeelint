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

var fs = require("fs"),
  xpath = require("xpath"),
  Dom = require("xmldom").DOMParser,
  debug = require("debug")("apigeelint:Policy");

function Policy(path, fn, parent, doc) {
  this.fileName = fn;
  this.filePath = path + "/" + fn;
  this.parent = parent;
  if (doc)
    this.element = doc;
  this.report = {
    filePath: this.filePath.substring(this.filePath.indexOf("/apiproxy")),
    errorCount: 0,
    warningCount: 0,
    fixableErrorCount: 0,
    fixableWarningCount: 0,
    messages: []
  };
}

Policy.prototype.getName = function() {
  if (!this.name) {
    var attr = xpath.select("//@name", this.getElement());
    this.name = (attr[0] && attr[0].value) || "";
  }
  return this.name;
};

Policy.prototype.getLines = function(start, stop) {
  //actually parse the source into lines if we haven't already and return the requested subset
  var result = "";
  if (!this.lines) {
    this.lines = fs.readFileSync(this.filePath).toString().split("\n");
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

Policy.prototype.getSource = function() {
  if (!this.source) {
    var start = this.getElement().lineNumber - 1,
      stop = Number.MAX_SAFE_INTEGER;
    if (
      this.getElement().nextSibling &&
      this.getElement().nextSibling.lineNumber
    ) {
      this.source = this.getElement().nextSibling.lineNumber - 1;
    }
    this.source = this.getLines(start, stop);
  }
  return this.source;
};

Policy.prototype.getDisplayName = function() {
  if (typeof this.displayName === 'undefined') {
    this.getName();
    let nodes = xpath.select("//DisplayName", this.getElement());
    if (nodes && nodes[0]) {
      if (nodes[0].childNodes && nodes[0].childNodes[0]) {
        this.displayName = nodes[0].childNodes[0].nodeValue;
        debug(`policy(${this.name}) DisplayName(${nodes[0].childNodes[0].nodeValue})`);
      }
      else {
        this.displayName = "";
        debug(`policy(${this.name}) DisplayName is present but empty`);
      }
    }
    else {
      this.displayName = null;
      debug(`policy(${this.name}) DisplayName is not present`);
    }
  }
  return this.displayName;
};

Policy.prototype.select = function(xs) {
  return xpath.select(xs, this.getElement());
};

Policy.prototype.getElement = function() {
  //read the contents of the file and return it raw
  if (!this.element) {
    this.element = new Dom().parseFromString(
      fs.readFileSync(this.filePath).toString()
    );
  }
  return this.element;
};

Policy.prototype.getFileName = function() {
  return this.fileName;
};

Policy.prototype.getType = function() {
  if (!this.type) {
    var doc = xpath.select("/", this.getElement());
    this.type =
      (doc &&
        doc[0] &&
        doc[0].documentElement &&
        doc[0].documentElement.tagName) ||
      "";
    if (this.type === "DisplayName") {
      this.type = "";
    }
  }
  return this.type;
};

Policy.prototype.addMessage = function(msg) {
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

Policy.prototype.getReport = function() {
  return this.report;
};

Policy.prototype.getSteps = function() {
  //walk through all steps (endpoints, flows, faultrules, defaultrules)
  //if we find this policy stuff it into this.steps

  if (!this.steps) {
    var policyName = this.getName(),
      steps = [],
      bundle = this.parent;
    //endpoints
    bundle.getEndpoints().forEach(function(ep) {
      //flows
      ep.getAllFlows().forEach(function(fl) {
        if (fl) {
          var fps = [fl.getFlowRequest()];
          fps.push(fl.getFlowResponse());
          fps.push(fl.getSharedFlow());
          fps.forEach(function(fp) {
            if (fp) {
              fp.getSteps().forEach(function(st) {
                if (st.getName() === policyName) {
                  steps.push(st);
                }
              });
            }
          });
        }
      });
      //faultrules
      ep.getFaultRules().forEach(function(fr) {
        if (fr) {
          fr.getSteps().forEach(function(st) {
            if (st.getName() === policyName) {
              steps.push(st);
            }
          });
        }
      });
      //default faultrule
      if (ep.getDefaultFaultRule()) {
        ep.getDefaultFaultRule().getSteps().forEach(function(st) {
          if (st.getName() === policyName) {
            steps.push(st);
          }
        });
      }
    });
    this.steps = steps;
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
