var assert = require('assert'), 
decache = require('decache'),path = require('path'),
fs = require('fs'),
debug = require('debug')('bundlelinter:testFlow'),
myUtil = require("../lib/package/myUtil.js");


  describe('Basic checks for bundle', function() {
    var configuration = {
        debug: true,
        "source": {
            "type":"filesystem",
            "path": "./resources/test_flow"
            //"path": "./resources/statistics_collector/one_stats_collector_twosteps_one_condition"
        }
    };
    debug("test configuration: " + JSON.stringify(configuration));

    //var Policy = require("../checkForMultipleStatsCollectorPolicies.js");

    //debug("requiring the bundle.js");
    //var Bundle = require("../Bundle.js");
    //debug("new Bundle(Configuration)");
    //var bundle = new Bundle(configuration);
    var bl = require("../lib/package/bundleLinter.js");
    var bundle = bl.lint(configuration);
    //console.log("calling bundle.summarize()");
    //debug("bundle.summarize()");
    //bundle.summarize();

    //console.log(bundle.getPolicies());
    var policies = bundle.getPolicies();

    debug("bundle.getPolicies().length = " + policies.length);

    it("should return 6 policies", function() {
      debug("number of policies: " + policies.length);
      assert.equal(policies.length, 6);
    });

    it("should return 1 step for each policy", function() {
      policies.forEach(function(policy){
        var steps = policy.getSteps();
        steps.forEach(function(step) {
          debug("step:" + step.getName());
          assert.equal(steps.length, 1);
        })
      } );
    });

    /*
    it("no steps should have a condition", function() {
      policies.forEach(function(policy){
        var steps = policy.getSteps();
        steps.forEach(function(step){
          assert.equal(step.getCondition(), undefined);
        });
      });
    });
    */
  });

  describe('StatisticsCollector1 attached to the ProxyEndpoint Preflow', function() {
    delete bundle;
    delete bl;
    decache("../Bundle.js");
    debug("Resetting the configuration...");
    mypath = path.resolve('');
    mypath = mypath.replace("test_flow", "test_flow");
    var configuration = {
        debug: true,
        "source": {
            "type":"filesystem",
            //"path": "./resources/statistics_collector/test_flow"
            "path": mypath
        }
    };
    debug("test configuration: " + JSON.stringify(configuration));

    var bl = require("../bundleLinter.js");
    var bundle = bl.lint(configuration);
    var policies = bundle.getPolicies();

    it("should be attached to Proxy Endpoint PreFlow", function() {
      policies.forEach(function(policy) {
        if(policy.getName() === "StatisticsCollector1"){
          debug("Found " + policy.getName());
          var steps = policy.getSteps();
          steps.forEach(function (step){
            var flowphase = step.getParent();
            var flow = flowphase.getParent();
            var endpoint = flow.getParent();
            debug("parent of " + policy.getName() + " " + JSON.stringify(flowphase.summarize()));
            debug("\nflow.getType(): " + flow.getType() + "\nflow.getFlowName(): " + flow.getFlowName() + "\nflow.getName(): " + flow.getName());
            debug("\nendpoint.getType(): " + endpoint.getType() + "\nendpoint.getProxyName(): " + endpoint.getProxyName() + "\nendpoint.getName(): " + endpoint.getName());

            assert.equal(flow.getType(), "PreFlow");
            assert.equal(endpoint.getType(), "ProxyEndpoint");
          });
        }
      });
    });

    it("should return 1 step", function() {
      policies.forEach(function(policy){
        if(policy.getName() === "StatisticsCollector1"){
          var steps = policy.getSteps();
          assert.equal(steps.length, 1);
        }
      });
    });

    it("should not have a condition", function() {
      policies.forEach(function(policy){
        if(policy.getName() === "StatisticsCollector1"){
          var steps = policy.getSteps();
          steps.forEach(function(step){
            assert.equal(step.getCondition(), undefined);
          });
        }
      });
    });

  });

  describe('StatisticsCollectorZip attached to the ProxyEndpoint Preflow', function() {
    delete bundle;
    delete bl;
    decache("../Bundle.js");
    debug("Resetting the configuration...");
    mypath = path.resolve('');
    mypath = mypath.replace("test_flow", "test_flow");
    var configuration = {
        debug: true,
        "source": {
            "type":"filesystem",
            //"path": "./resources/statistics_collector/test_flow"
            "path": mypath
        }
    };
    debug("test configuration: " + JSON.stringify(configuration));

    var bl = require("../bundleLinter.js");
    var bundle = bl.lint(configuration);
    var policies = bundle.getPolicies();
    var policyName = "StatisticsCollectorZip"

    it("should be attached to Proxy Endpoint PreFlow", function() {
      policies.forEach(function(policy) {
        if(policy.getName() === policyName){
          debug("Found " + policy.getName());
          var steps = policy.getSteps();
          steps.forEach(function (step){
            var flowphase = step.getParent();
            var flow = flowphase.getParent();
            var endpoint = flow.getParent();
            debug("parent of " + policy.getName() + " " + JSON.stringify(flowphase.summarize()));
            debug("\nflow.getType(): " + flow.getType() + "\nflow.getFlowName(): " + flow.getFlowName() + "\nflow.getName(): " + flow.getName());
            debug("\nendpoint.getType(): " + endpoint.getType() + "\nendpoint.getProxyName(): " + endpoint.getProxyName() + "\nendpoint.getName(): " + endpoint.getName());

            assert.equal(flow.getType(), "PreFlow");
            assert.equal(endpoint.getType(), "ProxyEndpoint");
          });
        }
      });
    });

    it("should return 1 step", function() {
      policies.forEach(function(policy){
        if(policy.getName() === policyName){
          var steps = policy.getSteps();
          assert.equal(steps.length, 1);
        }
      });
    });

    it("should not have a condition", function() {
      policies.forEach(function(policy){
        if(policy.getName() === policyName){
          var steps = policy.getSteps();
          steps.forEach(function(step){
            assert.equal(step.getCondition(), undefined);
          });
        }
      });
    });

  });


  describe('StatisticsCollectorFlows attached to the ProxyEndpoint Flow', function() {
    delete bundle;
    delete bl;
    decache("../Bundle.js");
    debug("Resetting the configuration...");
    mypath = path.resolve('');
    mypath = mypath.replace("test_flow", "test_flow");
    var configuration = {
        debug: true,
        "source": {
            "type":"filesystem",
            //"path": "./resources/statistics_collector/test_flow"
            "path": mypath
        }
    };
    debug("test configuration: " + JSON.stringify(configuration));

    var bl = require("../bundleLinter.js");
    var bundle = bl.lint(configuration);
    var policies = bundle.getPolicies();
    var policyName = "StatisticsCollectorFlows"

    it("should be attached to Proxy Endpoint Flow", function() {
      policies.forEach(function(policy) {
        if(policy.getName() === policyName){
          debug("Found " + policy.getName());
          var steps = policy.getSteps();
          steps.forEach(function (step){
            var flowphase = step.getParent();
            var flow = flowphase.getParent();
            var endpoint = flow.getParent();
            debug("parent of " + policy.getName() + " " + JSON.stringify(flowphase.summarize()));
            debug("\nflow.getType(): " + flow.getType() + "\nflow.getFlowName(): " + flow.getFlowName() + "\nflow.getName(): " + flow.getName());
            debug("\nendpoint.getType(): " + endpoint.getType() + "\nendpoint.getProxyName(): " + endpoint.getProxyName() + "\nendpoint.getName(): " + endpoint.getName());

            assert.equal(flow.getType(), "Flow");
            assert.equal(endpoint.getType(), "ProxyEndpoint");
          });
        }
      });
    });

    it("should return 1 step", function() {
      policies.forEach(function(policy){
        if(policy.getName() === policyName){
          var steps = policy.getSteps();
          assert.equal(steps.length, 1);
        }
      });
    });

    it("step should have a condition", function() {
      policies.forEach(function(policy){
        if(policy.getName() === policyName){
          var steps = policy.getSteps();
          steps.forEach(function(step){
            assert.notEqual(step.getCondition(), undefined);
          });
        }
      });
    });

    it("flow should have a condition", function() {
      policies.forEach(function(policy){
        if(policy.getName() === policyName){
          var steps = policy.getSteps();
          steps.forEach(function(step){
            flowphase = step.getParent();
            flow = flowphase.getParent();
            debug(flow.getType() + "\n" + JSON.stringify(flow.summarize()));
            debug("flow condition: " + JSON.stringify(flow.getCondition().getExpression()));
            assert.notEqual(flow.getCondition(), undefined);
          });
        }
      });
    });

    it("should be in the request phase", function() {
      policies.forEach(function(policy){
        if(policy.getName() === policyName){
          var steps = policy.getSteps();
          steps.forEach(function(step){
            flowphase = step.getParent();
            debug("flowPhase is: " + flowphase.getPhase());
            //flow = flowphase.getParent();
            assert.equal(flowphase.getPhase(), "Request");
          });
        }
      });
    });

    it("flow should have a description", function() {
      policies.forEach(function(policy){
        if(policy.getName() === policyName){
          var steps = policy.getSteps();
          steps.forEach(function(step){
            flowphase = step.getParent();
            flow = flowphase.getParent();
            assert.equal(flow.getDescription(), "Flow1 Description");
          });
        }
      });
    });

  });


  describe('StatisticsCollectorFlows2 attached to the ProxyEndpoint Flow.', function() {
    delete bundle;
    delete bl;
    decache("../Bundle.js");
    debug("Resetting the configuration...");
    mypath = path.resolve('');
    mypath = mypath.replace("test_flow", "test_flow");
    var configuration = {
        debug: true,
        "source": {
            "type":"filesystem",
            //"path": "./resources/statistics_collector/test_flow"
            "path": mypath
        }
    };
    debug("test configuration: " + JSON.stringify(configuration));

    var bl = require("../bundleLinter.js");
    var bundle = bl.lint(configuration);
    var policies = bundle.getPolicies();
    var policyName = "StatisticsCollectorFlows2"

    it("should be attached to Proxy Endpoint Flow", function() {
      policies.forEach(function(policy) {
        if(policy.getName() === policyName){
          debug("Found " + policy.getName());
          var steps = policy.getSteps();
          steps.forEach(function (step){
            var flowphase = step.getParent();
            var flow = flowphase.getParent();
            var endpoint = flow.getParent();
            debug("parent of " + policy.getName() + " " + JSON.stringify(flowphase.summarize()));
            debug("\nflow.getType(): " + flow.getType() + "\nflow.getFlowName(): " + flow.getFlowName() + "\nflow.getName(): " + flow.getName());
            debug("\nendpoint.getType(): " + endpoint.getType() + "\nendpoint.getProxyName(): " + endpoint.getProxyName() + "\nendpoint.getName(): " + endpoint.getName());

            assert.equal(flow.getType(), "Flow");
            assert.equal(endpoint.getType(), "ProxyEndpoint");
          });
        }
      });
    });

    it("should return 1 step", function() {
      policies.forEach(function(policy){
        if(policy.getName() === policyName){
          var steps = policy.getSteps();
          assert.equal(steps.length, 1);
        }
      });
    });

    it("step should not have a condition", function() {
      policies.forEach(function(policy){
        if(policy.getName() === policyName){
          var steps = policy.getSteps();
          steps.forEach(function(step){
            assert.equal(step.getCondition(), undefined);
          });
        }
      });
    });

    it("flow should not have a condition", function() {
      policies.forEach(function(policy){
        if(policy.getName() === policyName){
          var steps = policy.getSteps();
          steps.forEach(function(step){
            flowphase = step.getParent();
            flow = flowphase.getParent();
            debug(flow.getType() + "\n" + JSON.stringify(flow.summarize()));
            assert.equal(flow.getCondition(), undefined);
          });
        }
      });
    });

    it("should be in the response phase", function() {
      policies.forEach(function(policy){
        if(policy.getName() === policyName){
          var steps = policy.getSteps();
          steps.forEach(function(step){
            flowphase = step.getParent();
            assert.equal(flowphase.getPhase(), "Response");
          });
        }
      });
    });

    it("flow should have a description", function() {
      policies.forEach(function(policy){
        if(policy.getName() === policyName){
          var steps = policy.getSteps();
          steps.forEach(function(step){
            flowphase = step.getParent();
            flow = flowphase.getParent();
            assert.equal(flow.getDescription(), "Flow2 Description");
          });
        }
      });
    });

    it("flow should have a Flow Name.", function() {
      policies.forEach(function(policy){
        if(policy.getName() === policyName){
          var steps = policy.getSteps();
          steps.forEach(function(step){
            flowphase = step.getParent();
            flow = flowphase.getParent();
            assert.equal(flow.getFlowName(), "apiproxy/proxies/default.xml:#document:ProxyEndpoint:Flows:Flow2");
          });
        }
      });
    });

    it("flow request phase should be undefined", function() {
      policies.forEach(function(policy){
        if(policy.getName() === policyName){
          var steps = policy.getSteps();
          steps.forEach(function(step){
            flowphase = step.getParent();
            flow = flowphase.getParent();
            assert.equal(flow.getFlowRequest().getSteps().length, 0);
          });
        }
      });
    });

    it("flow response phase should have one step", function() {
      policies.forEach(function(policy){
        if(policy.getName() === policyName) {
          var steps = policy.getSteps();
          steps.forEach(function(step){
            flowphase = step.getParent();
            flow = flowphase.getParent();
            assert.notEqual(flow.getFlowResponse(), undefined);
            assert.equal(flow.getFlowResponse().getSteps().length, 1);
          });
        }
      });
    });

    it("flow element should be <Flow name=\"Flow2\">...</Flow>", function() {
      policies.forEach(function(policy){
        if(policy.getName() === policyName) {
          var steps = policy.getSteps();
          steps.forEach(function(step){
            flowphase = step.getParent();
            flow = flowphase.getParent();
            assert.notEqual(flow.getElement(), undefined);
            doc = flow.getElement();
            debug("flow.getElement():" + doc.toString());
            //docName = myUtil.selectAttributeValue(doc[0].documentElement.attributes, "name");
            assert.equal(doc.toString(), "<Flow name=\"Flow2\">\n\
         <Description>Flow2 Description</Description>\n\
        <Request>\n\
        </Request>\n\
        <Response>\n\
          <Step>\n\
              <Name>StatisticsCollectorFlows2</Name>\n\
          </Step>\n\
        </Response>\n\
      </Flow>");
          });
        }
      });
    });
/*
    it("flow parent should be ", function() {
      policies.forEach(function(policy){
        if(policy.getName() === policyName) {
          var steps = policy.getSteps();
          steps.forEach(function(step){
            flowphase = step.getParent();
            flow = flowphase.getParent();
            assert.notEqual(flow.getParent(), undefined);
            debug("flow.getParent().getName():" + flow.getParent().getName());
            assert.equal(flow.getParent().getName(), "What should the name be?");
          });
        }
      });
    });
*/
    it("flow parent type should be endpoint", function() {
      policies.forEach(function(policy){
        if(policy.getName() === policyName) {
          var steps = policy.getSteps();
          steps.forEach(function(step){
            flowphase = step.getParent();
            flow = flowphase.getParent();
            assert.notEqual(flow.getParent(), undefined);
            debug("flow.getParent().getType():" + flow.getParent().getType());
            assert.equal(flow.getParent().getType(), "ProxyEndpoint");
          });
        }
      });
    });

  });
/*
  describe("one Statistics collector policy attached to two steps one with condition and one without.", function() {
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
                "type":"filesystem",
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

    it('should return 1 policy', function() {
      assert.equal( policies.length, 1);
    });

    it('should return 2 steps', function() {
      var steps = policies[0].getSteps();
      assert.equal(steps.length, 2);
    });

    it('warning should be presented to the user.', function() {
      var messages = policies[0].getMessages();
      assert.equal( messages.warnings.length, 1);
    });
  });
*/
