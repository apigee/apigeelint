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

const ruleId = require("../myUtil.js").getRuleId(),
      debug = require("debug")("apigeelint:" + ruleId);

const plugin = {
        ruleId,
        name: "Check for multiple CORS policies",
        message:
        "Only one CORS Policy is necessary. It should attach in the Proxy Preflow.",
        fatal: false,
        severity: 2, // error
        nodeType: "Endpoint",
        enabled: true
      };

const onBundle = function(bundle, cb) {
        debug('onBundle');
        let checker = new BundleChecker(bundle);
        let flagged = checker.check();

        if (typeof(cb) == 'function') {
          cb(null, flagged);
        }
      };

const onProxyEndpoint = function(endpoint, cb) {
        debug('onProxyEndpoint');
        let checker = new EndpointChecker(endpoint, true);
        let flagged = checker.check();
        if (typeof(cb) == 'function') {
          cb(null, flagged);
        }
      };

const onTargetEndpoint = function(endpoint, cb) {
        debug('onTargetEndpoint');
        let checker = new EndpointChecker(endpoint, false);
        let flagged = checker.check();
        if (typeof(cb) == 'function') {
          cb(null, flagged);
        }
      };

const  _markPolicy = (policy, msg) => {
        let result = {
              ruleId: plugin.ruleId,
              severity: plugin.severity,
              source: policy.getSource(),
              line: policy.getElement().lineNumber,
              column: policy.getElement().columnNumber,
              nodeType: "Policy",
              message: msg
            };
        policy.addMessage(result);
      };


const  _markStep = (step, msg) => {
        let result = {
              ruleId: plugin.ruleId,
              severity: plugin.severity,
              entity: step,
              line: step.getElement().lineNumber,
              column: step.getElement().columnNumber,
              nodeType: "Step",
              message: msg
            };
        step.addMessage(result);
      };

const _markEndpoint = (endpoint, msg) => {
        var result = {
              ruleId: plugin.ruleId,
              severity: plugin.severity,
              nodeType: plugin.nodeType,
              message: msg
            };
        endpoint.addMessage(result);
      };

class BundleChecker {
  constructor(bundle) {
    debug('BundleChecker ctor');
    this.bundle = bundle;
    this.flagged = false;
  }

  check() {
    if (this.bundle.policies) {

      debug("number of policies: " + this.bundle.policies.length);
      let corsPolicies = this.bundle.policies.filter(policy => (policy.getType() === "CORS"));

      debug("number of CORS policies: " + corsPolicies.length);
      if (corsPolicies.length > 1) {
        this.flagged = this._checkForDuplicatePolicies(corsPolicies);
      }
      return this.flagged;
    }
  }

  _checkForDuplicatePolicies(policies) {
    let dupes = BundleChecker._getDuplicates('/CORS', policies);
    if (dupes.length > 0) {
      debug("there are " + dupes.length + " repeated policies.");
      let duplicatePolicyNames = dupes.map( p => p.getName()).join(" ");
      debug("duplicate policies: " + duplicatePolicyNames);
      policies.forEach(policy => {
        debug("duplicate policy warning for " + policy.getName());
        _markPolicy(
          policy,
          "The following CORS policies are configured: " +
            duplicatePolicyNames
        );
      });
      return true;
    }
  }

  static _getDuplicates(xpath, policies) {
    let dupes = [];
    for (var i = 0; i < policies.length - 1; i++) {
      for (var j = i + 1; j < policies.length; j++) {
        var p1 = policies[i].select(xpath).toString().trim();
        var p2 = policies[j].select(xpath).toString().trim();
        debug("comparing -> \n1st policy:\n" + p1 + "\n2nd policy:\n" + p2);
        if (p1 === p2) {
          if (dupes.indexOf(policies[i]) === -1) {
            dupes.push(policies[i]);
            debug(policies[i].getName() + " is a duplicate!");
          }
          if (dupes.indexOf(policies[j]) === -1) {
            dupes.push(policies[j]);
            debug(policies[j].getName() + " is a duplicate!");
          }
        }
      }
    }
    return dupes;
  }
}


class EndpointChecker {
  constructor(endpoint, isProxyEndpoint) {
    debug('EndpointChecker ctor (%s)', endpoint.getName());
    this.endpoint = endpoint;
    this.bundle = endpoint.parent;
    this.isProxyEndpoint = isProxyEndpoint;
    this.flagged = false;
  }

  check() {
    try {
      this.corsPoliciesInBundle =
        this.bundle.policies
        .filter(policy => (policy.getType() === "CORS"))
        .reduce(function(obj, policy) {
          obj[policy.getName()] = policy;
          return obj;
        }, {});


      let keys = Object.keys(this.corsPoliciesInBundle);
      debug('CORS policies in endpoint: ' + JSON.stringify(keys));

      // Ensure at most one attachment for any CORS policy,
      // or, conditions on all CORS policies.
      let corsStepsInEndpoint = this.endpoint
        .getSteps()
        .filter( step => keys.indexOf(step.getName())>=0);

      if (this.isProxyEndpoint) {
        if (corsStepsInEndpoint.length > 1) {
          this.flagged = this._checkStepsForMissingConditions(corsStepsInEndpoint);
        }
        else {
          debug('zero or one CORS policies in this endpoint');
        }
      }
      else {
        if (corsStepsInEndpoint.length > 0) {
          corsStepsInEndpoint.forEach(step => {
          _markStep(
            step,
            "There is a CORS policy attached to a TargetEndpoint.  Attach CORS policies to a ProxyEndpoint.");

          });
          this.flagged = true;
        }
      }

      return this.flagged;
    }
    catch(e) {
      console.log(e);
      return false;
    }
  }

  _checkStepsForMissingConditions(steps) {
    let anyStepsLackCondition =
      steps.filter( step => {
        if ( ! step.getCondition()) {
          let name = step.getName();
          _markStep(
            step,
            //this.corsPoliciesInBundle[name],
            `There are multiple CORS policies and policy ${name} is attached to a Step without a Condition.`);
          return true;
        }
      });

    if (anyStepsLackCondition.length > 0) {
      _markEndpoint(
        this.endpoint,
        "There are multiple CORS policies attached, at least one without a condition.  If you have more than one CORS policy, only the last one in the flow will be effective.  Wrap each one in a condition to make sure the correct one is used."
      );
      return true;
    }
  }
}


module.exports = {
  plugin,
  onBundle,
  onProxyEndpoint,
  onTargetEndpoint
};
