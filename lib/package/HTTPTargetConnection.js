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

var xpath = require("xpath");

function HTTPTargetConnection(element, parent) {
  this.parent = parent;
  this.element = element;
}

HTTPTargetConnection.prototype.getName = function() {
  if (!this.name) {
    var attr = xpath.select("//@name", this.element);
    this.name = (attr[0] && attr[0].value) || "";
  }
  return this.name;
};

HTTPTargetConnection.prototype.getMessages = function() {
  return this.parent.getMessages();
};

HTTPTargetConnection.prototype.getLines = function(start, stop) {
  return this.parent.getLines(start, stop);
};

HTTPTargetConnection.prototype.getSource = function() {
  if (!this.source) {
    var start = this.element.lineNumber - 1,
      stop = this.element.nextSibling.lineNumber - 1;
    this.source = this.getLines(start, stop);
  }
  return this.source;
};

HTTPTargetConnection.prototype.getType = function() {
  return this.element.tagName;
};

HTTPTargetConnection.prototype.getURL = function() {
    if (!this.URL) {
      var doc = xpath.select("./URL", this.element);
      if (doc && doc[0]) {
        this.URL = (doc[0].childNodes[0].nodeValue) || "";
      }
    }
    return this.URL;
  };

HTTPTargetConnection.prototype.getProperties = function() {
  var props = [];
  if (!this.properties) {
    var propsNodeList = xpath.select("./Properties", this.element)[0].childNodes;
    Array.from(propsNodeList).forEach(function(prop) {
        if (prop.childNodes){
            props[prop.attributes[0].nodeValue]=prop.childNodes[0].nodeValue;
        }
    });
  }
  return props;
};

HTTPTargetConnection.prototype.getElement = function() {
  return this.element;
};

HTTPTargetConnection.prototype.getParent = function() {
  return this.parent;
};

HTTPTargetConnection.prototype.addMessage = function(msg) {
  if (!msg.hasOwnProperty("entity")) {
    msg.entity = this;
  }
  this.parent.addMessage(msg);
};

HTTPTargetConnection.prototype.summarize = function() {
  var summary = {};
  summary.name = this.getName();
  summary.basePath = this.getBasePath();
  return summary;
};

//Public
module.exports = HTTPTargetConnection;
