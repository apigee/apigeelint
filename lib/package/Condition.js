/*
  Copyright 2019, 2023, 2025 Google LLC

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

const TruthTable = require("./TruthTable.js"),
  ConfigElement = require("./ConfigElement.js");

class Condition extends ConfigElement {
  constructor(element, parent) {
    super(element, parent);
  }

  getExpression = () =>
    (this.element.childNodes &&
      this.element.childNodes[0] &&
      this.element.childNodes[0].nodeValue) ||
    "";

  getTruthTable() {
    if (!this.truthTable) {
      this.truthTable = new TruthTable(
        this.getExpression().replace(/(\n| +)/g, " "),
      );
    }
    return this.truthTable;
  }

  onConditions(pluginFunction, cb) {
    pluginFunction(this, cb);
  }

  summarize() {
    const summary = {
      type: "Condition",
      condition: this.getExpression(),
    };
    try {
      summary.truthTable = this.getTruthTable();
    } catch (e) {
      //just swallow it
    }
    return summary;
  }
}

//Public
module.exports = Condition;
