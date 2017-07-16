//Policy.js

//Private
var fs = require("fs"),
  xpath = require("xpath"),
  Dom = require("xmldom").DOMParser,
  debug = require("debug")("bundlelinter:Policy");

function Policy(path, fn, parent) {
  this.fileName = fn;
  this.filePath = path + "/" + fn;
  this.parent = parent;
  this.report = {
    filePath: this.filePath,
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
      this.getElement().nextSibling.lineNumber - 1;
    }
    this.source = this.getLines(start, stop);
  }
  return this.source;
};

Policy.prototype.getDisplayName = function() {
  if (!this.displayName) {
    var doc = xpath.select("//DisplayName", this.getElement());
    if (doc && doc[0] && doc[0].childNodes && doc[0].childNodes[0]) {
      this.displayName = doc[0].childNodes[0].nodeValue;
    } else {
      this.displayName = "";
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
  }
  return this.type;
};

Policy.prototype.addMessage = function(msg) {
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

Policy.prototype.getReport = function() {
  return this.report;
};

Policy.prototype.getSteps = function() {
  if (!this.steps) {
    if (this.parent) {
      var policyName = this.getName(),
        steps = [];
      //bundle -> endpoints -> flows -> flowphases -> steps.getName()
      debug(
        "number of endpoints for this policy: " +
          this.parent.getEndpoints().length
      );
      this.parent.getEndpoints().forEach(function(ep) {
        debug(
          "endpoint name: " + ep.getName() + "; endpoint type: " + ep.getType()
        );
        ep.getAllFlows().forEach(function(fl) {
          debug(
            "flow name: " +
              fl.getName() +
              "; flow type: " +
              fl.getType() +
              "; flow.getFlowName(): " +
              fl.getFlowName()
          );
          var fps = [fl.getFlowRequest()];
          fps.push(fl.getFlowResponse());
          //fps.concat(fl.getFlowResponse());
          fps.forEach(function(fp) {
            if (fp) {
              fp.getSteps().forEach(function(st) {
                if (st.getName() === policyName) {
                  debug("step " + st.getName() + " pushed onto steps array");
                  steps.push(st);
                }
              });
            }
          });
        });
      });
      this.steps = steps;
    } else {
      this.steps = ["no parent to parse for steps"];
    }
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
