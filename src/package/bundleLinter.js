//bundleLinter.js
var fs = require("fs"),
    path = require("path"),
    config;

function contains(a, obj, f) {
    if (!a || !a.length) {
        return false;
    }
    f = f || function (lh, rh) {
        return lh === rh;
    };

    for (var i = 0; i < a.length; i++) {
        if (f(a[i], obj)) {
            if (!a[i]) {
                return true;
            }
            return a[i];
        }
    }
    return false;
}

function getReport(b) {
    var result={'bundle':{},'policies':[]};
    if (b.messages) {
        result.bundle.errors=b.messages.errors;
        result.bundle.warnings=b.messages.warnings;
    }
    if (b.policies) {
        b.policies.forEach(function (policy) {
            if (policy.messages && (policy.getMessages().warnings.length > 0 || policy.getMessages().errors.length > 0)) {
                result.policies.push({'fileName':policy.getFileName(),'errors':policy.getMessages().errors,'warnings':policy.getMessages().warnings});
            }
        });
    }
    return result;
}

var Bundle = require("./Bundle.js"),
    lint = function (aconfig) {
        //the config
        config = aconfig;
        var bundle = new Bundle(config);
        //for each plugin
        var normalizedPath = path.join(__dirname, "plugins");
        fs.readdirSync(normalizedPath).forEach(function (file) {
            if (!config.plugins || (contains(config.plugins, file))) {
                //lets see if this really is a plugin
                var plugin = require("./plugins/" + file);
                plugin.onBundle && plugin.onBundle(bundle);
                plugin.onStep && bundle.onSteps(plugin.onStep);
                plugin.onCondition && bundle.onConditions(plugin.onCondition);
                plugin.onProxyEndpoint && bundle.onProxyEndpoints(plugin.onProxyEndpoint);
                plugin.onTargetEndpoint && bundle.onTargetEndpoints(plugin.onTargetEndpoint);
                plugin.onResource && bundle.onResources(plugin.onResource);
                plugin.onPolicy && bundle.onPolicies(plugin.onPolicy);
            }
        });
        return getReport(bundle);
    };

module.exports = {
    lint
};
