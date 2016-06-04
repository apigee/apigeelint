//bundleLinter.js
var fs = require("fs"),
    path = require("path"),
    myUtil=require("./myUtil.js"),
    config;

function report(b) {
    if (b.messages) {
        myUtil.print("Bundle:");
        myUtil.print(b.messages);
        myUtil.print("");
    }
    if (b.policies) {
        myUtil.print("Policies:");
        b.policies.forEach(function(policy) {
            if (policy.messages) {
                myUtil.print(policy.getFileName());
                myUtil.print("-----------");
                myUtil.print(policy.getMessages());
                myUtil.print("");
            }
        });
    }

}

var Bundle = require("./Bundle.js"),
    lint = function(aconfig) {
        //the config
        config = aconfig;
        var bundle = new Bundle(config);
        //for each plugin
        var normalizedPath = path.join(__dirname, "plugins");
        fs.readdirSync(normalizedPath).forEach(function(file) {
            var plugin = require("./plugins/" + file);
            //lets see if this really is a plugin
            plugin.onBundle && plugin.onBundle(bundle);
            plugin.onStep && bundle.onSteps(plugin.onStep);
            plugin.onCondition && bundle.onConditions(plugin.onCondition);
            plugin.onProxyEndpoint && bundle.onProxyEndpoints(plugin.onProxyEndpoint);
            plugin.onTargetEndpoint && bundle.onTargetEndpoints(plugin.onTargetEndpoint);
            plugin.onResource && bundle.onResources(plugin.onResource);
            plugin.onPolicy && bundle.onPolicies(plugin.onPolicy);
        });
        report(bundle);
    };

module.exports = {
    lint
};
