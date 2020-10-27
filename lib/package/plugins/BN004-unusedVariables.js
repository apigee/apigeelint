/*
  Copyright 2019-2020 Google LLC

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
      ruleId = require("../myUtil.js").getRuleId(),
      debug = require("debug")("apigeelint:" + ruleId);

var plugin = {
    ruleId,
    name: "Unused Variables",
    message: "Look for variables that were defined but not referenced.",
    fatal: false,
    severity: 1, //warn
    nodeType: "Bundle",
    enabled: false
    };
let hadWarnErr = false;

// This plugin does **NOT** check for variables that are used incorrectly.
// TODO: FaultRules

// basic regex for finding variables
// TODO: handle objects -- right now just verify the highest level variable.
var varFinder = /{([^}\.]+?)(\.[^}]+?)??}/g;

// preload the symbol table with framework globals
var globalSymtab = ["proxy", "request", "response", "message"];

// global bundle ... until I objectize this...
// TODO Objectize.
var glBundle;
var usageMetrics = {};

// Process proxyendpoints in the following order:
// 1. preflow - request [steps]
// 2. flow - request [steps]
// 3. postflow - request [steps]
// 4. routerules
//    - targetendpoint
//       . pre/flow/post
//       . pre - response
//       . flow - response
//       . post - response
// TODO: inspect things referenced by steps to populate symbol table and check for bad var references.
var onBundle = function(bundle, cb) {
  function processFlow(flow, localSymtab) {
    if (flow.getFlowRequest()) {
      evaluateSteps(flow.getFlowRequest().getSteps(), localSymtab);
    }
    if (flow.getFlowResponse()) {
      evaluateSteps(flow.getFlowResponse().getSteps(), localSymtab);
    }
  }

  function process(pt, localSymtab) {
    if (pt.getPreFlow()) {
      processFlow(pt.getPreFlow(), localSymtab);
    }
    pt.getFlows().forEach(function(flow) {
      processFlow(flow, localSymtab);
    });
    if (pt.getPostFlow()) {
      processFlow(pt.getPostFlow());
    }
  }
  glBundle = bundle;
  bundle.getProxyEndpoints().forEach(function(endpoint) {
    var localSymtab = [];
    process(endpoint, localSymtab);

    // TODO: evalute routrule conditions

    var intermediateSymtab = localSymtab.slice(0); // don't update orig array references!
    var intermediateUsage = JSON.parse(JSON.stringify(usageMetrics)); // save usage metrics
    // iterate through routerules now ...
    if (bundle.getTargetEndpoints()) {
      bundle.getTargetEndpoints().forEach(function(target) {
        localSymtab = intermediateSymtab.slice(0); // reset the local symbol table
        usageMetrics = JSON.parse(JSON.stringify(intermediateUsage)); // reset usage for this iteration

        process(target, localSymtab);
        localSymtab.forEach(function(symbol) {
          if (!usageMetrics[symbol]) {
            var result = {
              ruleId: plugin.ruleId,
              severity: plugin.severity,
              source: target.getSource(),
              line: target.getElement().lineNumber,
              column: target.getElement().columnNumber,
              nodeType: plugin.nodeType,
              message:
                "Target flow defines but does not use symbol '" + symbol + "'."
            };
            target.addMessage(result);
            hadWarnErr=true;
          }
        });
      });
    }
  });
  if (typeof cb == "function") {
    cb(null, hadWarnErr);
  }
};

// TODO: evalute where symbols are added, and record them in our symbol table.
var evaluateSteps = function(steps, localSymtab) {
  var badVars;
  steps.forEach(function(step) {
    if (step.getName()) {
      badVars = analyzeVariables(step.getName(), localSymtab);
      badVars.forEach(function(badvar) {
        var result = {
          ruleId: plugin.ruleId,
          severity: 2, //override to error
          source: step.getSource(),
          line: step.getElement().lineNumber,
          column: step.getElement().columnNumber,
          nodeType: plugin.nodeType,
          message:
            "Variable {" +
            badvar +
            "} was used in step name, but not previously defined."
        };
        step.addMessage(result);
        hadWarnErr=true;
      });
    }
    if (step.getCondition()) {
      badVars = analyzeVariables(step.getCondition().getExpression());
      badVars.forEach(function(badvar) {
        var result = {
          ruleId: plugin.ruleId,
          severity: plugin.severity,
          source: step.getSource(),
          line: step.getElement().lineNumber,
          column: step.getElement().columnNumber,
          nodeType: plugin.nodeType,
          message:
            "Variable {" +
            badvar +
            "} was used in step condition, but not previously defined."
        };
        step.addMessage(result);
        hadWarnErr=true;
      });
    }

    // TODO: dispatch to handlers to evaluate the assignment and use of variables.
    var policy = glBundle.getPolicyByName(step.getName());
    policy &&
      handlers[policy.getType()] &&
      handlers[policy.getType()](policy, localSymtab);
    policy &&
      !handlers[policy.getType()] &&
      debug("No handler for policy type '" + policy.getType() + "'");
  });
};

// return a list of variables referenced in this string
// that are undefined (may be empty)
var analyzeVariables = function(value, localSymtab) {
  var symtab = globalSymtab.concat(localSymtab);
  var undefinedVars = [],
    match;
  while ((match = varFinder.exec(value)) != null) {
    var variable = match[1];
    usageMetrics[variable] = (usageMetrics[variable] || 0) + 1;
    if (!(variable in symtab)) {
      undefinedVars.push(variable);
    }
  }
  return undefinedVars;
};

var _identity = function(policy, localSymtab) {};
var handlers = {
  // TODO: lots more handlers!
  ExtractVariables(policy, localSymtab) {
    var payloadVariablesXpath =
      "/ExtractVariables/*[self::JSONPayload or self::XMLPayload]/Variable/@name";
    var payloadVariables = policy.select(payloadVariablesXpath);
    payloadVariables.forEach(function(variableDecl) {
      var variableName = variableDecl.value;
      localSymtab.push(variableName);
    });
  },
  JSONThreatProtection: _identity
};

module.exports = {
  plugin,
  onBundle
};
