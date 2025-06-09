/*
  Copyright © 2025 Google LLC

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

const xpath = require("xpath"),
  debug = require("debug")("apigeelint:ConfigElement");

class ConfigElement {
  constructor(element, parent) {
    this.parent = parent;
    this.element = element;
    this.bundle = false;
  }

  select(xs) {
    return xpath.select(xs, this.element);
  }

  getElement() {
    return this.element;
  }
  getName() {
    return "unset";
  }

  getParent() {
    debug(`> getParent name=${this.getName()}`);
    return this.parent;
  }

  getSource() {
    if (!this.source) {
      var start = this.element.lineNumber - 1,
        stop =
          (this.element.nextSibling &&
            this.element.nextSibling.lineNumber - 1) ||
          this.element.lastChild.lineNumber;
      this.source = this.getLines(start, stop);
    }
    return this.source;
  }

  getLines(start, stop) {
    return this.parent.getLines(start, stop);
  }

  addMessage(msg) {
    if (!msg.hasOwnProperty("entity")) {
      msg.entity = this;
    }
    this.parent.addMessage(msg);
  }

  // // TODO: determine if this is necessary
  // getMessages() {
  //   return this.parent.getMessages();
  // }

  getBundle() {
    if (this.bundle === false) {
      let antecedent = this.parent;
      while (antecedent && antecedent.constructor.name != "Bundle") {
        antecedent = antecedent.getParent();
      }
      this.bundle = antecedent;
    }
    return this.bundle;
  }
}

//Public
module.exports = ConfigElement;
