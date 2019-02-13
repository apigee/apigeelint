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

var Condition = require("./Condition.js"),
  FaultRule = require("./FaultRule.js"),
  async = require("async"),
  xpath = require("xpath"),
  myUtil = require("./myUtil.js");

function Step(element, parent) {
  this.parent = parent;
  this.element = element;
}

Step.prototype.getLines = function(start, stop) {
  return this.parent.getLines(start, stop);
};

Step.prototype.getMessages = function() {
  return this.parent.getMessages();
};

Step.prototype.getSource = function() {
  if (!this.source) {
    var start = this.element.lineNumber - 1,
      stop =
        (this.element.nextSibling && this.element.nextSibling.lineNumber - 1) ||
        this.element.lastChild.lineNumber;
    this.source = this.getLines(start, stop);
  }
  return this.source;
};

Step.prototype.getName = function() {
  if (!this.name) {
    var doc = xpath.select("./Name", this.element);
    this.name =
      (doc &&
        doc[0] &&
        doc[0].childNodes[0] &&
        doc[0].childNodes[0].nodeValue) ||
      "";
  }
  return this.name;
};

Step.prototype.getType = function() {
  if (!this.type) {
    this.type = xpath.select("name(/*)", this.element);
  }
  return this.type;
};

Step.prototype.getFlowName = function() {
  if (!this.flowName) {
    this.flowName =
      myUtil.getFileName(this) +
      ":" +
      myUtil.buildTagBreadCrumb(this.element) +
      this.getName();
  }
  return this.flowName;
};

Step.prototype.getFaultRules = function() {
  if (!this.routeRules) {
    var doc = xpath.select("./FaultRules/FaultRule", this.element),
      st = this;
    st.faultRules = [];
    if (doc) {
      doc.forEach(function(frElement) {
        //flows get a flow from here
        st.faultRules.push(new FaultRule(frElement, st));
      });
    }
  }
  return this.routeRules;
};

Step.prototype.getCondition = function() {
  if (!this.condition) {
    var element = xpath.select("./Condition", this.element);
    this.condition = element && element[0] && new Condition(element[0], this);
  }
  return this.condition;
};

Step.prototype.select = function(xs) {
  return xpath.select(xs, this.element);
};

Step.prototype.getElement = function() {
  return this.element;
};

Step.prototype.getParent = function() {
  return this.parent;
};

Step.prototype.addMessage = function(msg) {
  if (!msg.hasOwnProperty("entity")) {
    msg.entity = this;
  }
  this.parent.addMessage(msg);
};

Step.prototype.onConditions = function(pluginFunction, callback) {
  //async
  var step=this;

  async.parallel(
    [
      function(cb) {
        if (step.getCondition()) {
          pluginFunction(step.getCondition(), cb);
        }
      },
      function(cb) {
        if (step.getFaultRules()) {
          async.each(
            step.getFaultRules(),
            function(fr) {
              fr.onConditions(pluginFunction, cb);
            },
            function(err) {
              cb(err);
            }
          );
        }
      }
    ],
    function(err, result) {
      if (err) {
        callback(err);
      } else {
        callback(null, result);
      }
    }
  );
};

Step.prototype.onSteps = function(pluginFunction, callback) {
  //async
  var step=this;

  async.parallel(
    [
      function(cb) {
        pluginFunction(step, cb);
      },
      function(cb) {
        if (step.getFaultRules()) {
          async.each(
            step.getFaultRules(),
            function(fr) {
              fr.onSteps(pluginFunction, cb);
            },
            function(err) {
              cb(err);
            }
          );
        }
      }
    ],
    function(err, result) {
      if (err) {
        callback(err);
      } else {
        callback(null, result);
      }
    }
  );
};

Step.prototype.summarize = function() {
  var summary = {};
  summary.name = this.getName();
  summary.flowName = this.getFlowName();
  var faultRules = this.getFaultRules();
  if (faultRules) {
    summary.faultRules = [];
    faultRules.forEach(function(fr) {
      summary.faultRules.push(fr.summarize());
    });
  }
  summary.condition =
    (this.getCondition() && this.getCondition().summarize()) || {};
  return summary;
};

//Public
module.exports = Step;
