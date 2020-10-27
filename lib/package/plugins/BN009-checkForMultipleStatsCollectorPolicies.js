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
        name: "Check for multiple statistics collector policies",
        message:
        "Only one Statistics Collector Policy will be executed.  Therefore, if you include mulitiple Statistics Collector Policies then you must have conditions on each one.",
        fatal: false,
        severity: 1, //warn
        nodeType: "Bundle",
        enabled: true
      };

let statsPolicies = [], hadWarnErr=false;

var onBundle = function(bundle, cb) {
  statsPolicies = [];
  if (bundle.policies) {
    debug("number of policies: " + bundle.policies.length);
    bundle.policies.forEach(function(policy) {
      if (isStatsCollectorPolicy(policy)) {
        debug("statistics collector policy added: " + policy.getName());
        statsPolicies.push(policy);
      }
    });
    debug("number of statistics collector policies: " + statsPolicies.length);
    if (statsPolicies.length > 1) {
      checkForDuplicatePolicies(statsPolicies);
      //checkForMoreThanOneStatsPolicyOnFlow(statsPolicies, bundle);
      checkPoliciesForMissingConditions(statsPolicies, bundle);
    }

    /*
    This was a prior check to confirm that other Bundle features are working
    such as the number of steps being pulled and the number of flows being
    pulled correctly
    */
    statsPolicies.forEach(function(policy) {
      attachedToMoreThanOneStepAndNoConditions(policy);
    });
  }
  if (typeof(cb) == 'function') {
    cb(null,hadWarnErr);
  }
};

/*
Determine if this is a statistics collector policy.
@returns true if it is or false otherwise
*/
function isStatsCollectorPolicy(policy) {
  var policyType = policy.getType();
  if (policyType === "StatisticsCollector") {
    return true;
  } else {
    return false;
  }
}

function markPolicy(policy, msg) {
  var result = {
    ruleId: plugin.ruleId,
    severity: plugin.severity,
    source: policy.getSource(),
    line: policy.getElement().lineNumber,
    column: policy.getElement().columnNumber,
    nodeType: plugin.nodeType,
    message: msg
  };
  policy.addMessage(result);
  hadWarnErr=true;
}

function markBundle(bundle, msg) {
  var result = {
    ruleId: plugin.ruleId,
    severity: plugin.severity,
    nodeType: plugin.nodeType,
    message: msg
  };
  bundle.addMessage(result);
  hadWarnErr=true;
}

/*
*/
function checkForDuplicatePolicies(policies) {
  var duplicates = getDuplicatePolicies(policies);
  debug("there are " + duplicates.length + " duplicate policies.");
  if (duplicates.length > 0) {
    var duplicatePolicyNames = concatenateDuplicatePolicyNames(policies);
    debug("duplicate policies: " + duplicatePolicyNames);
    policies.forEach(function(policy) {
      debug("duplicate policy warning for " + policy.getName());
      markPolicy(
        policy,
        "The following StatisticsCollectors are configured: " +
          duplicatePolicyNames
      );
    });
  }
}

function concatenateDuplicatePolicyNames(policies) {
  var names = "";
  policies.forEach(function(policy) {
    names += policy.getName() + " ";
  });
  return names.trim();
}

function getDuplicatePolicies(policies) {
  var duplicatePolicies = [];
  for (var i = 0; i < policies.length - 1; i++) {
    for (var j = i + 1; j < policies.length; j++) {
      var p1 = policies[i].select("//Statistics").toString().trim();
      var p2 = policies[j].select("//Statistics").toString().trim();
      debug("comparing -> \n1st policy:\n" + p1 + "\n2nd policy:\n" + p2);
      if (p1 === p2) {
        if (duplicatePolicies.indexOf(policies[i]) === -1) {
          duplicatePolicies.push(policies[i]);
          debug(policies[i].getName() + " is a duplicate!");
        }
        if (duplicatePolicies.indexOf(policies[j]) === -1) {
          duplicatePolicies.push(policies[j]);
          debug(policies[j].getName() + " is a duplicate!");
        }
      }
    }
  }
  return duplicatePolicies;
}

/*
Check the policies for missng conditions, but make sure
that the policies are attached to the flow.
*/
function checkPoliciesForMissingConditions(policies, bundle) {
  var attachedPolicies = getAttachedPolicies(policies);
  if (attachedPolicies.length > 1) {
    var doAllStepsHaveCondition = true;
    attachedPolicies.forEach(function(policy) {
      if (!allStepsHaveCondition(policy)) {
        doAllStepsHaveCondition = false;
        markPolicy(
          policy,
          policy.getName() +
            " is attached to a step without a condition.  If you have more than two Statistics Collector policies, only the last one in the flow will execute.  Include a condition to make sure the correct one executes."
        );
      }
    });
    debug("doAllStepsHaveCondition: " + doAllStepsHaveCondition);
    if (!doAllStepsHaveCondition) {
      markBundle(
        bundle,
        "There are several Statistics Collector policies attached to a step without a condition.  If you have more than two Statistics Collector policies, only the last one in the flow will execute.  Include a condition to make sure the correct one executes."
      );
    }
  }
}

/*
If there are two or more stats collector policies, then
make sure that they are all attached.
*/
function getAttachedPolicies(policies) {
  var attachedPolicies = [];
  policies.forEach(function(policy) {
    if (isAttached(policy)) {
      debug(policy.getName() + " is attached to the flow.");
      attachedPolicies.push(policy);
    }
  });
  return attachedPolicies;
}

/*
Check if there are any stats policies attached to multiple steps without conditions.
@returns true if a policy without a condition exists otherwise false.
*/
function attachedToMoreThanOneStepAndNoConditions(policy) {
  if (isAttachedToMoreThanOneStep(policy) && !allStepsHaveCondition(policy)) {
    markPolicy(
      policy,
      policy.getName() +
        " is attached to multiple steps, but all the steps don't have a condition. This may result in unexpected behaviour."
    );
  }
}

/*
Is this policy attached to a step
*/
function isAttached(policy) {
  var steps = policy.getSteps();
  if (steps) {
    return true;
  } else {
    return false;
  }
}

/*
Is the policy attached to more than one step
@param policy
@returns true if the policy is attached to more than one step, false otherwise
*/
function isAttachedToMoreThanOneStep(policy) {
  var steps = policy.getSteps();
  if (steps) {
    if (steps.length <= 1) {
      debug("policy " + policy.getName() + " is attached to zero or one step.");
      return false;
    }
    if (steps.length > 1) {
      debug(
        "policy " +
          policy.getName() +
          " is attached to " +
          steps.length +
          " steps."
      );
      return true;
    }
  }
}

/*
Check if all the steps have a condition.
@param policy
@return true if all steps have a condition, otherwise false
If there are no steps for the policy then return false
*/
function allStepsHaveCondition(policy) {
  var steps = policy.getSteps();
  var result = true;
  if (steps) {
    steps.forEach(function(step) {
      if (!step.getCondition()) {
        debug(policy.getName() + " is attached to a step without a condition.");
        result = false;
      }
    });
  } else {
    debug(policy.getName() + " is not attached to any steps.");
    result = false;
  }
  if (result) {
    debug(
      "all the steps to which " +
        policy.getName() +
        " is attached have a condition."
    );
  }
  return result;
}

module.exports = {
  plugin,
  onBundle
};
