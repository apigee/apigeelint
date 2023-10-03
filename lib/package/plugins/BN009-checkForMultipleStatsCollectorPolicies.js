/*
  Copyright 2019-2020,2023 Google LLC

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
    "Only one Statistics Collector Policy will be executed.  Therefore, if you include mulitiple Statistics Collector Policies then you should have conditions on all but one.",
  fatal: false,
  severity: 1, //warn
  nodeType: "Bundle",
  enabled: true
};

let hadWarnErr = false;

const onBundle = function (bundle, cb) {
  /*
   * This is implemented with onBundle, so that the plugin can
   * check for duplicates. It does check only single policies in isolation,
   * but checks each Stats policy against others in the bundle.
   **/
  let statsPolicies = [];
  if (bundle.policies) {
    debug("number of policies: " + bundle.policies.length);
    statsPolicies = bundle.policies.filter((policy) =>
      isStatsCollectorPolicy(policy)
    );
    debug("number of statistics collector policies: " + statsPolicies.length);
    if (statsPolicies.length > 0) {
      debug(
        "statistics collector policies: " +
          statsPolicies.map((p) => p.getName())
      );
    }
    if (statsPolicies.length > 1) {
      checkForDuplicatePolicies(statsPolicies);
      //checkForMoreThanOneStatsPolicyOnFlow(statsPolicies, bundle);
      checkPoliciesForMissingConditions(statsPolicies, bundle);
    }

    /*
     * This was a prior check to confirm that other Bundle features are working
     * such as the number of steps being pulled and the number of flows being
     * pulled correctly
     **/
    statsPolicies.forEach(function (policy) {
      attachedToMoreThanOneStepAndNoConditions(policy);
    });
  }
  if (typeof cb == "function") {
    cb(null, hadWarnErr);
  }
};

/*
 * Determine if this is a statistics collector policy.
 * @returns true if it is or false otherwise
 **/
function isStatsCollectorPolicy(policy) {
  return policy.getType() === "StatisticsCollector";
}

function markPolicy(policy, msg) {
  const result = {
    ruleId: plugin.ruleId,
    severity: plugin.severity,
    source: policy.getSource(),
    line: policy.getElement().lineNumber,
    column: policy.getElement().columnNumber,
    nodeType: plugin.nodeType,
    message: msg
  };
  policy.addMessage(result);
  hadWarnErr = true;
}

function checkForDuplicatePolicies(policies) {
  const duplicates = getDuplicatePolicies(policies);
  debug("there are " + duplicates.length + " duplications.");
  if (duplicates.length > 0) {
    duplicates.forEach((item) => {
      const duplicatePolicyNames = item.dupes.map((p) => p.getName()).join(" ");
      debug(
        `original policy: ${item.policy.getName()} duplicates: ${duplicatePolicyNames}`
      );
      markPolicy(
        item.policy,
        "The following StatisticsCollector policies are duplicates: " +
          duplicatePolicyNames
      );
    });
  }
}

function getDuplicatePolicies(policies) {
  // A naive dupe finder - it looks for string equality in the XML.
  // A better approach would be to check each attribute value.
  const duplicateFinder = function (acc, c, ix, a) {
    const p1 = c.select("//Statistics").toString().trim();
    const dupes = a
      .slice(ix + 1)
      .filter((p) => p.select("//Statistics").toString().trim() == p1);
    return dupes.length ? [...acc, { policy: c, dupes }] : acc;
  };

  // return an array of hashes.
  // each item is a hash  {policy, dupes}
  return policies.reduce(duplicateFinder, []);
}

/*
 * Check the policies for missing conditions, but make sure
 * that the policies are attached to the flow.
 ***/
function checkPoliciesForMissingConditions(policies, _bundle) {
  const attachedPolicies = getAttachedPolicies(policies);
  if (attachedPolicies.length > 1) {
    attachedPolicies.forEach(function (policy) {
      if (!allStepsHaveCondition(policy)) {
        markPolicy(
          policy,
          policy.getName() +
            " is attached to a step without a Condition. If you have more than two StatisticsCollector policies, only the last one in the flow will execute. Include a Condition to make sure the correct one executes."
        );
      }
    });
  }
}

/*
 * If there are two or more stats collector policies, then
 * make sure that they are all attached.
 **/
function getAttachedPolicies(policies) {
  return policies.filter((policy) => isAttached(policy));
}

/*
 * Check if there are any stats policies attached to multiple steps without conditions.
 * @returns true if a policy without a condition exists otherwise false.
 **/
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
 * Is this policy attached to a step
 **/
function isAttached(policy) {
  return !!policy.getSteps();
}

/*
 * Is the policy attached to more than one step
 * @param policy
 * @returns true if the policy is attached to more than one step, false otherwise
 **/
function isAttachedToMoreThanOneStep(policy) {
  const steps = policy.getSteps();
  if (steps) {
    debug(`policy ${policy.getName()} is attached to ${steps.length} steps.`);
    return steps.length > 1;
  }
  return false;
}

/*
 * Check if all the steps have a condition.
 * @param policy
 * @return true if all steps have a condition, otherwise false
 * If there are no steps for the policy then return false
 **/
function allStepsHaveCondition(policy) {
  const steps = policy.getSteps();
  let result = true;
  if (steps) {
    steps.forEach(function (step) {
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
      `all the steps to which ${policy.getName()} is attached have a condition.`
    );
  }
  return result;
}

module.exports = {
  plugin,
  onBundle
};
