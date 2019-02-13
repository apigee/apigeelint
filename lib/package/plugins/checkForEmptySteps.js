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

var plugin = {
  ruleId: "ST001",
  name: "Empty Steps",
  message: "Empty steps clutter a bundle. Performance is not degraded.",
  fatal: false,
  severity: 1,
  nodeType: "Step",
  enabled: true
};

var onStep = function(step, cb) {
  var hadWarn = false;

  if (step.getName() === "") {
    step.addMessage({
      source: step.getSource(),
      line: step.getElement().lineNumber,
      column: step.getElement().columnNumber,
      plugin,
      message: "Step name is empty."
    });
    hadWarn = true;
  }
  if (typeof cb == "function") {
    cb(null, hadWarn);
  }
};

module.exports = {
  plugin,
  onStep
};
