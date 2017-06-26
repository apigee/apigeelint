var assert = require("assert"),
  decache = require("decache"),
  path = require("path"),
  fs = require("fs"),
  debug = require("debug")("bundlelinter:testMultipleStatsCollectorPolicies");
//var bl = require("../bundleLinter.js");


describe('one Statistics collector policy attached to one flow and no condition', function () {
  var configuration = {
    debug: true,
    "source": {
      "type": "filesystem",
      "path": "./resources/statistics_collector/one_stats_collector_no_condition"
      //"path": "./resources/statistics_collector/one_stats_collector_twosteps_one_condition"
    }
  };
  debug("test1 configuration: " + JSON.stringify(configuration));

  //var Policy = require("../checkForMultipleStatsCollectorPolicies.js");

  //debug("requiring the bundle.js");
  //var Bundle = require("../Bundle.js");
  //debug("new Bundle(Configuration)");
  //var bundle = new Bundle(configuration);
  var bl = require("../bundleLinter.js");
  var bundle = bl.lint(configuration);
  //console.log("calling bundle.summarize()");
  //debug("bundle.summarize()");
  //bundle.summarize();

  //console.log(bundle.getPolicies());
  var policies = bundle.getPolicies();
  debug("bundle.getPolicies() = " + policies.length);
  var steps = policies[0].getSteps();
  debug("policy name: " + policies[0].getName());
  debug("bundle steps: " + steps.length);
  steps.forEach(function (step) {
    debug("step:" + step.getName());
  })

  it("should return 1 policy", function () {
    debug("number of policies: " + policies.length);
    assert.equal(policies.length, 1);
  });

  it("should return 1 step", function () {
    //var steps = policies[0].getSteps();
    debug("number of steps: " + steps.length);
    assert.equal(steps.length, 1);
  });

  it("should not have a condition", function () {
    //var steps = policies[0].getSteps();
    var condition = steps[0].getCondition();
    debug("condition: " + condition);
    assert.equal(condition, undefined);
  });

  it("no warning should be presented to the user.", function () {
    var messages = policies[0].getMessages();
    debug("message warnings length: " + messages.warnings.length);
    assert.equal(messages.warnings.length, 0);
  });

});



describe("one Statistics collector policy attached to two steps one with condition and one without.", function () {
  delete bundle;
  delete bl;
  decache("../Bundle.js");
  debug("Resetting the configuration...");
  mypath = path.resolve('');
  mypath = mypath.replace("one_stats_collector_no_condition", "one_stats_collector_twosteps_one_condition");
  debug(mypath);

  var configuration = {
    debug: true,
    "source": {
      "type": "filesystem",
      //"path": "./resources/statistics_collector/one_stats_collector_no_condition"
      "path": mypath,
    }
  };
  debug("configuration object:" + JSON.stringify(configuration));
  //var Bundle = require("../Bundle.js");
  //bundle = new Bundle(configuration);
  var bl = require("../bundleLinter.js");
  var bundle = bl.lint(configuration);
  //debug("calling bundle.summarize()...");
  //bundle.summarize();

  var policies = bundle.getPolicies();
  var steps = policies[0].getSteps();
  debug("Number of policies: " + policies.length);
  debug("Number of steps: " + steps.length);

  it('should return 1 policy', function () {
    assert.equal(policies.length, 1);
  });

  it('should return 2 steps', function () {
    var steps = policies[0].getSteps();
    assert.equal(steps.length, 2);
  });

  it('warning should be presented to the user.', function () {
    var messages = policies[0].getMessages();
    assert.equal(messages.warnings.length, 1);
  });
});

describe("duplicate Statistics collector policies are identified and flagged.", function () {
  delete bundle;
  delete bl;
  decache("../Bundle.js");
  debug("Resetting the configuration...");
  mypath = path.resolve('');
  mypath = mypath.replace("one_stats_collector_twosteps_one_condition", "two_duplicate_stats_collector_on_conditions");
  debug(mypath);

  var configuration = {
    debug: true,
    "source": {
      "type": "filesystem",
      //"path": "./resources/statistics_collector/one_stats_collector_no_condition"
      "path": mypath,
    }
  };
  debug("configuration object:" + JSON.stringify(configuration));
  //var Bundle = require("../Bundle.js");
  //bundle = new Bundle(configuration);
  var bl = require("../bundleLinter.js");
  var bundle = bl.lint(configuration);
  //debug("calling bundle.summarize()...");
  //bundle.summarize();

  var policies = bundle.getPolicies();
  var steps = policies[0].getSteps();
  debug("Number of policies: " + policies.length);
  debug("Number of steps: " + steps.length);

  it('should return 4 policies', function () {
    assert.equal(policies.length, 4);
  });

  it('should return 1 step for all policies', function () {
    policies.forEach(function (policy) {
      var steps = policy.getSteps();
      assert.equal(steps.length, 1);
    });
  });

  it('warning should be presented to the user for all policies.', function () {
    policies.forEach(function (policy) {
      var messages = policy.getMessages();
      assert(messages.warnings.length > 0);
    });
  });

  it('guidance should be: Remove the duplicate Statistics Collector policies from your bundle.', function () {
    policies.forEach(function (policy) {
      var guidance = policies[0].getMessages().warnings[0].guidance;
      assert.equal(guidance, "Remove the duplicate Statistics Collector policies from your bundle.");
    });
  });
});


describe("Multiple Statistics Collector policies but no conditions.", function () {
  delete bundle;
  delete bl;
  decache("../Bundle.js");
  debug("Resetting the configuration...");
  mypath = path.resolve('');
  mypath = mypath.replace("two_duplicate_stats_collector_on_conditions", "multiple_stats_collector_missing_conditions");
  debug(mypath);

  var configuration = {
    debug: true,
    "source": {
      "type": "filesystem",
      //"path": "./resources/statistics_collector/multiple_stats_collector_missing_conditions"
      "path": mypath,
    }
  };
  debug("configuration object:" + JSON.stringify(configuration));
  //var Bundle = require("../Bundle.js");
  //bundle = new Bundle(configuration);
  var bl = require("../bundleLinter.js");
  var bundle = bl.lint(configuration);
  //debug("calling bundle.summarize()...");
  //bundle.summarize();

  var policies = bundle.getPolicies();

  debug("Number of policies: " + policies.length);
  it('should return 4 policies', function () {
    assert.equal(policies.length, 4);
  });

  it('should return 1 step for all policies', function () {
    policies.forEach(function (policy) {
      var steps = policy.getSteps();
      assert.equal(steps.length, 1);
    });
  });

  it('all policies should have warnings.', function () {
    policies.forEach(function (policy) {
      //debug("Policy: " + policy.getName());
      var messages = policy.getMessages();
      assert.equal(messages.warnings.length, 1);
    });
  });

  it('Policy guidance should be: If you have more than two Statistics Collector policies, only the last one in the flow will execute.  Include a condition to make sure the correct one executes.', function () {
    policies.forEach(function (policy) {
      var guidance = policy.getMessages().warnings[0].guidance;
      assert.equal(guidance, "If you have more than two Statistics Collector policies, only the last one in the flow will execute.  Include a condition to make sure the correct one executes.");
    });
  });

  it('Bundle guidance should be: There are several Statistics Collector policies attached to a step without a condition.', function () {
    assert.equal(bundle.messages.warnings[0].name, "There are several Statistics Collector policies attached to a step without a condition.");
  });

});
