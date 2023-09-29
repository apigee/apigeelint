/*
  Copyright 2019-2023 Google LLC

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

const ruleId = require("../myUtil.js").getRuleId(),
  plugin = {
    ruleId,
    name: "Check for not well-formed XML",
    message: "not well formed XML.",
    fatal: true,
    severity: 2, //1=warn, 2=error
    nodeType: "Bundle",
    enabled: true,
  },
  debug = require("debug")("apigeelint:BN011"),
  fs = require("fs"),
  path = require("path"),
  { XMLParser, XMLBuilder, XMLValidator } = require("fast-xml-parser");

let foundError = false;

let thisBundle = null;
const onBundle = function (bundle, cb) {
  thisBundle = bundle;
  if (typeof cb == "function") {
    cb(null, false);
  }
};

const onPolicy = function (policy, cb) {
  // sometimes the fileName is fully Qualified, sometimes not!
  const fqPath = policy.fileName.startsWith("/")
    ? policy.fileName
    : path.join(thisBundle.root, "policies", policy.fileName);
  debug(`policy filename: ${fqPath}`);
  const content = fs.readFileSync(fqPath, "utf-8"),
    result = XMLValidator.validate(content, {});
  if (result.err) {
    policy.addMessage({
      plugin,
      message:
        `Step ${policy.getName()} configuration` +
        ` is not well-formed XML (${result.err.msg}).`,
      line: result.err.line,
      column: result.err.col,
    });
    foundError = true;
  }

  if (typeof cb == "function") {
    cb(null, foundError);
  }
};

const endpointHandler = (endpointType) =>
  function (endpoint, cb) {
    // it may be possible that the fileName will not be fully qualified
    const pathSegment = endpointType == "proxy" ? "proxies" : "targets";
    const fqPath = endpoint.fileName.startsWith("/")
      ? endpoint.fileName
      : path.join(thisBundle.root, pathSegment, endpoint.fileName);
    debug(`endpoint filename: ${fqPath}`);
    const content = fs.readFileSync(fqPath, "utf-8"),
      result = XMLValidator.validate(content, {});
    if (result.err) {
      endpoint.addMessage({
        plugin,
        message:
          `Configuration for ${endpointType} endpoint` +
          ` ${endpoint.getName()} is not well-formed XML (${result.err.msg}).`,
        line: result.err.line,
        column: result.err.col,
      });
      foundError = true;
    }

    if (typeof cb == "function") {
      cb(null, foundError);
    }
  };

const onProxyEndpoint = endpointHandler("proxy");

const onTargetEndpoint = endpointHandler("target");

module.exports = {
  plugin,
  onBundle,
  onPolicy,
  onProxyEndpoint,
  onTargetEndpoint,
};
