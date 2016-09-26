var debug = require('debug')('bundlelinter:checkForMultipleStatsCollectorPolicies');
var name = "Check for multiple statistics collector policies.",
    description = "Only one Statistics Collector Policy will be executed.  Therefore, if you include mulitiple Statistics Collector Policies then you must have conditions on each one.",
    myUtil=require("../myUtil.js");

var statsPolicies = [];

var onBundle = function(bundle) {
  statsPolicies = [];
  if (bundle.policies) {
      debug("number of policies: " + bundle.policies.length);
      bundle.policies.forEach(function (policy) {
          if(isStatsCollectorPolicy(policy)) {
              debug("statistics collector policy added: " + policy.getName());
              statsPolicies.push(policy);
          }
      });
      debug("number of statistics collector policies: " + statsPolicies.length);
      if(statsPolicies.length > 1){
        checkForDuplicatePolicies(statsPolicies);
        //checkForMoreThanOneStatsPolicyOnFlow(statsPolicies, bundle);
        checkPoliciesForMissingConditions(statsPolicies, bundle);
      }

      /*
      This was a prior check to confirm that other Bundle features are working
      such as the number of steps being pulled and the number of flows being
      pulled correctly
      */
      statsPolicies.forEach(function(policy){
        attachedToMoreThanOneStepAndNoConditions(policy);
      });
  }
};

/*
Determine if this is a statistics collector policy.
@returns true if it is or false otherwise
*/
function isStatsCollectorPolicy(policy){
    var policyType = policy.getType();
    if(policyType === "StatisticsCollector") {
        return true;
    } else {
        return false;
    }
}

/*
*/
function checkForDuplicatePolicies(policies){
  var duplicates = getDuplicatePolicies(policies);
  debug("there are " + duplicates.length + " duplicate policies.");
  if(duplicates.length > 0) {
    var duplicatePolicyNames = concatenateDuplicatePolicyNames(policies);
    debug("duplicate policies: " + duplicatePolicyNames);
    policies.forEach(function(policy){
      debug("duplicate policy warning for " + policy.getName());
      policy.warn({
          name: "The following policies: " + duplicatePolicyNames + " are duplicates of one another.",
          guidance: "Remove the duplicate Statistics Collector policies from your bundle."
      });
    });
  }
}

function concatenateDuplicatePolicyNames(policies){
    var names = "";
    policies.forEach(function (policy){
      names += policy.getName() + " ";
    });
    return names.trim();
}

function getDuplicatePolicies(policies){
  duplicatePolicies = [];
  for(i = 0; i < policies.length - 1; i++){
    for( j = i + 1; j < policies.length; j++){
      var p1 = policies[i].select("//Statistics").toString().trim();
      var p2 = policies[j].select("//Statistics").toString().trim();
      debug("comparing -> \n1st policy:\n" + p1 + "\n2nd policy:\n" + p2);
      if(p1 === p2){
        if(duplicatePolicies.indexOf(policies[i]) === -1){
          duplicatePolicies.push(policies[i]);
          debug(policies[i].getName() + " is a duplicate!");
        }
        if(duplicatePolicies.indexOf(policies[j]) === -1){
          duplicatePolicies.push(policies[j]);
          debug(policies[j].getName() + " is a duplicate!");
        }
      }
    }
  }
  return duplicatePolicies;
}

function checkForMoreThanOneStatsPolicyOnFlow(policies, bundle){
  //identify policies on same flow

}

/*
Check the policies for missng conditions, but make sure
that the policies are attached to the flow.
*/
function checkPoliciesForMissingConditions(policies, bundle){
  var attachedPolicies = getAttachedPolicies(policies);
  if(attachedPolicies.length > 1){
    var doAllStepsHaveCondition = true;
    attachedPolicies.forEach(function(policy){
      if(!allStepsHaveCondition(policy)){
        doAllStepsHaveCondition = false;
        policy.warn({
            name: policy.getName() + " is attached to a step without a condition.",
            guidance: "If you have more than two Statistics Collector policies, only the last one in the flow will execute.  Include a condition to make sure the correct one executes."
        });

      }
    });
    debug("doAllStepsHaveCondition: " + doAllStepsHaveCondition);
    if(!doAllStepsHaveCondition){
      bundle.warn({
          name: "There are several Statistics Collector policies attached to a step without a condition.",
          guidance: "If you have more than two Statistics Collector policies, only the last one in the flow will execute.  Include a condition to make sure the correct one executes."
      });
    }
  }
}

/*
If there are two or more stats collector policies, then
make sure that they are all attached.
*/
function getAttachedPolicies(policies) {
  attachedPolicies = [];
  policies.forEach(function(policy){
    if(isAttached(policy)){
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
function attachedToMoreThanOneStepAndNoConditions(policy){
  if(isAttachedToMoreThanOneStep(policy) && !allStepsHaveCondition(policy)){
      policy.warn({
          name: "Policy " + policy.getName() + " is attached to multiple steps, but all the steps don't have a condition.",
          guidance: "The same policy is attached to multiple steps."
      });
  }
}

/*
Is this policy attached to a step
*/
function isAttached(policy){
  var steps = policy.getSteps();
  if(steps){
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
function isAttachedToMoreThanOneStep(policy){
    var steps = policy.getSteps();
    if(steps){
        if(steps.length <= 1) {
          debug("policy " + policy.getName() + " is attached to zero or one step.");
          return false;
        }
        if(steps.length > 1) {
          debug("policy " + policy.getName() + " is attached to " + steps.length + " steps.");
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
function allStepsHaveCondition(policy){
    var steps = policy.getSteps();
    var result = true;
    if(steps){
        steps.forEach(function(step){
            if(!hasCondition(step)){
                debug(policy.getName() + " is attached to a step without a condition.");
                result = false;
            }
        });
    } else {
      debug(policy.getName() + " is not attached to any steps.");
      result = false;
  }
  if(result) debug("all the steps to which " + policy.getName() + " is attached have a condition." );
  return result;
}

/*
Check if the step has a condition.
@param step
@return true if step has a condition otherwise false
*/
function hasCondition(step){
    var expression = step.getCondition();
    if(expression){
        return true;
    } else {
        return false;
    }
}

module.exports = {
    name,
    description,
    onBundle
};
