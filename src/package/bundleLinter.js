//bundleLinter.js
var fs = require("fs"),
    path = require("path"),
    config;

function print(msg) {
    try {
        if (msg && (typeof msg === "object")) {
            console.log(JSON.stringify(msg, null, 4));
        } else {
            console.log(msg);
        }
    } catch (error) {
        console.log(error);
    }
}

function warn(msg) {
    print(msg);
}

function debugPrint(msg) {
    if (config.debug) {
        print(msg);
    }
}

function getStackTrace(e) {
    return e.stack.replace(/^[^\(]+?[\n$]/gm, "")
        .replace(/^\s+at\s+/gm, "")
        .replace(/^Object.<anonymous>\s*\(/gm, "{anonymous}()@")
        .split("\n");
}

function report(b) {
    if (b.messages) {
        print("Bundle:");
        print(b.messages);
        print("");
    }
    if (b.steps) {
        print("Steps:");
        b.steps.forEach(function(step) {
            if (step.messages) {
                print(step.getFileName() + ":" + step.getFlowName());
                print("-----------");
                print(step.getMessages());
                print("");
            }
        });
    }
    if (b.policies) {
        print("Policies:");
        b.policies.forEach(function(policy) {
            if (policy.messages) {
                print(policy.getFileName());
                print("-----------");
                print(policy.getMessages());
                print("");
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
            plugin.checkBundle && plugin.checkBundle(bundle);
            plugin.checkStep && bundle.checkSteps(plugin.checkStep);
            plugin.checkPolicy && bundle.checkPolicies(plugin.checkPolicy);
        });
        report(bundle);
    };

module.exports = {
    lint
};
