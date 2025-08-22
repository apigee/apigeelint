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

const xpath = require("xpath"),
  ConfigElement = require("./ConfigElement.js"),
  debug = require("debug")("apigeelint:HTC");

class HTTPTargetConnection extends ConfigElement {
  constructor(element, parent) {
    super(element, parent);
  }

  getName() {
    if (!this.name) {
      var attr = xpath.select("//@name", this.element);
      this.name = (attr[0] && attr[0].value) || "";
    }
    return this.name;
  }

  getType = () => this.element.tagName;

  getURL() {
    if (!this.URL) {
      var doc = xpath.select("./URL", this.element);
      if (doc && doc[0]) {
        this.URL = doc[0].childNodes[0].nodeValue || "";
      }
    }
    return this.URL;
  }

  getProperties() {
    let props = new Map();
    if (!this.properties) {
      debug("HTTPTargetConnection.js getting properties");
      const propsElements = xpath.select("./Properties", this.element);
      const propsNodeList = propsElements && propsElements[0];
      if (propsNodeList?.childNodes) {
        Array.from(propsNodeList.childNodes).forEach(function (prop) {
          if (prop.childNodes) {
            props[prop.attributes[0].nodeValue] = prop.childNodes[0].nodeValue;
          }
        });
      }
    }
    return props;
  }

  // unsure if used
  summarize = () => ({
    name: this.getName(),
    basePath: this.getBasePath(),
  });
}

//Public
module.exports = HTTPTargetConnection;
