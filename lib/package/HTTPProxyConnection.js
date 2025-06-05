/*
  Copyright 2019,2024 Google LLC

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
  ConfigElement = require("./ConfigElement.js");

class HTTPProxyConnection extends ConfigElement {
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

  getBasePath() {
    if (!this.basePath) {
      var doc = xpath.select("./BasePath", this.element);
      if (doc && doc[0]) {
        this.basePath = (doc && doc[0] && doc[0].childNodes[0].nodeValue) || "";
      }
    }
    return this.basePath;
  }

  getProperties() {
    if (this.properties == undefined) {
      let props = {};
      this.properties = props;
      let propsNodeList = xpath.select("./Properties", this.element);
      if (propsNodeList && propsNodeList[0]) {
        Array.from(propsNodeList[0].childNodes).forEach((prop) => {
          if (prop.childNodes && prop.attributes[0] && prop.childNodes[0]) {
            props[prop.attributes[0].nodeValue] = prop.childNodes[0].nodeValue;
          }
        });
      }
    }
    return this.properties;
  }

  // not sure this is ever used
  summarize = () => ({
    name: this.getName(),
    basePath: this.getBasePath(),
  });
}

//Public
module.exports = HTTPProxyConnection;
