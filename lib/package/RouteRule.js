/*
  Copyright 2019, 2025 Google LLC

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

const Condition = require("./Condition.js"),
  ConfigElement = require("./ConfigElement.js"),
  xpath = require("xpath");

class RouteRule extends ConfigElement {
  constructor(element, parent) {
    super(element, parent);
  }

  getName() {
    if (!this.name) {
      let attr = xpath.select("//@name", this.element);
      this.name = (attr[0] && attr[0].value) || "";
    }
    return this.name;
  }

  getType() {
    return this.element.tagName;
  }

  getTargetEndpoint() {
    if (!this.targetEndpoint) {
      let doc = xpath.select("./TargetEndpoint", this.element);
      if (doc[0]) {
        this.targetEndpoint =
          (doc[0] &&
            doc[0].childNodes &&
            doc[0].childNodes[0] &&
            doc[0].childNodes[0].nodeValue) ||
          "";
      } else {
        this.targetEndpoint = null;
      }
    }
    return this.targetEndpoint;
  }

  getCondition() {
    if (!this.condition) {
      let doc = xpath.select("./Condition", this.element);
      this.condition = doc && doc[0] && new Condition(doc[0], this);
    }
    return this.condition;
  }

  onConditions(pluginFunction, cb) {
    if (this.getCondition()) {
      pluginFunction(this.getCondition(), cb);
    }
  }

  summarize = () => ({
    name: this.getName(),
    targetEndpoint: this.getTargetEndpoint(),
    condition: (this.getCondition() && this.getCondition().summarize()) || {},
  });
}

//Public
module.exports = RouteRule;
