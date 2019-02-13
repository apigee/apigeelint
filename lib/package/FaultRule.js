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
  xpath = require("xpath"),
  async = require("async");

function FaultRule(element, parent) {
  this.parent = parent;
  this.element = element;
}

FaultRule.prototype.getName = function() {
  if (!this.name) {
    var attr = xpath.select("./@name", this.element);
    this.name = (attr[0] && attr[0].value) || "";
  }
  return this.name;
};

FaultRule.prototype.getMessages = function() {
  return this.parent.getMessages();
};

FaultRule.prototype.getLines = function(start, stop) {
  return this.parent.getLines(start, stop);
};

FaultRule.prototype.getSource = function() {
  if (!this.source) {
    var start = this.element.lineNumber - 1,
      stop = this.element.nextSibling.lineNumber - 1;
    this.source = this.getLines(start, stop);
  }
  return this.source;
};

FaultRule.prototype.getType = function() {
  return this.element.tagName;
};

FaultRule.prototype.getSteps = function() {
  if (!this.steps) {
    var doc = xpath.select("./Step", this.element),
      fr = this,
      Step = require("./Step.js");
    fr.steps = [];
    if (doc) {
      doc.forEach(function(stElement) {
        fr.steps.push(new Step(stElement, fr));
      });
    }
  }
  return this.steps;
};

FaultRule.prototype.getCondition = function() {
  if (!this.condition) {
    var doc = xpath.select("./Condition", this.element);
    this.condition = doc && doc[0] && new Condition(doc[0], this);
  }
  return this.condition;
};

FaultRule.prototype.getElement = function() {
  return this.element;
};

FaultRule.prototype.getParent = function() {
  return this.parent;
};

FaultRule.prototype.addMessage = function(msg) {
  if (!msg.hasOwnProperty("entity")) {
    msg.entity = this;
  }
  this.parent.addMessage(msg);
};

FaultRule.prototype.onConditions = function(pluginFunction, callback) {
  //async
  var faultRule = this;

  async.parallel(
    [
      function(cb) {
        if (faultRule.getCondition()) {
          pluginFunction(faultRule.getCondition(), cb);
        } else {
          cb("FaultRule no condition");
        }
      },
      function(cb) {
        if (faultRule.getSteps()) {
          async.each(
            faultRule.getSteps(),
            function(step, cb) {
              step.onConditions(pluginFunction, cb);
            },
            function(err) {
              cb(err);
            }
          );
        } else {
          cb("FaultRule no steps");
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

FaultRule.prototype.onSteps = function(pluginFunction, callback) {
  //async
  var faultRule = this;

  if (faultRule.getSteps()) {
    async.each(
      faultRule.getSteps(),
      function(step, cb) {
        step.onSteps(pluginFunction, cb);
      },
      function(err) {
        callback(err);
      }
    );
  } else {
    callback("FaultRule no steps");
  }
};

FaultRule.prototype.summarize = function() {
  var summary = {};
  summary.name = this.getName();
  var theSteps = this.getSteps();
  summary.steps = [];
  theSteps.forEach(function(step) {
    summary.steps.push(step.summarize());
  });
  summary.condition =
    (this.getCondition() && this.getCondition().summarize()) || {};
  return summary;
};

//Public
module.exports = FaultRule;
