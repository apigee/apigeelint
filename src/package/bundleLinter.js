//bundleLinter.js
var config;

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
        print(b.messages);
        print("");
    }
    b.policies.forEach(function(policy) {
        if (policy.messages) {
            print(policy.getFileName());
            print("-----------");
            print(policy.getMessages());
            print("");
        }
    });
}

var FindFolder = require("node-find-folder"),
    fs = require("fs"),
    path = require("path"),
    Policy = require("./Policy.js"),
    init = {
        config(config) {
            //lets preload the bundle structure here
            var bundle = this[config.source.type](config);
            return bundle;
        },
        filesystem(config) {
            process.chdir(config.source.path);

            //ok lets build our bundle representation from file system
            //note all methods ultimately will call this init
            //usually after they retrieve the bundle from a remote
            //two structures are supported
            //apiproxy at root of config.path or one level deeper
            //this will facilitate analyzing pom files as well
            var bundle = {
                    root: config.source.path,
                    policies: [],
                    messages: { warnings: [], errors: [] },
                    warn(msg) {
                        return this.messages.warnings.push(msg);
                    },
                    err(msg) {
                        return this.messages.errors.push(msg);
                    }
                },
                folders = new FindFolder("apiproxy");

            folders.some(function(folder) {
                if (folder.indexOf("target/") === -1) {
                    bundle.proxyRoot = folder;
                    return;
                }
            });

            //get the list of policies and create the policy objects
            try {
                var files = fs.readdirSync(bundle.proxyRoot + "/policies");
                files.forEach(function(policyFile) {
                    bundle.policies.push(new Policy(bundle.proxyRoot + "/policies", policyFile));
                });
            } catch (error) {
                console.log(error);
            }
            return bundle;
        }
    },
    lint = function(aconfig) {
        //the config
        try {
            config = aconfig;
            var bundle = init.config(config);
            //for each plugin
            var normalizedPath = path.join(__dirname, "plugins");
            fs.readdirSync(normalizedPath).forEach(function(file) {
                var plugin = require("./plugins/" + file);
                //lets see if this really is a plugin
                plugin.checkBundle && plugin.checkBundle(bundle);
                plugin.checkPolicy && bundle.policies.forEach(plugin.checkPolicy);
            });
            report(bundle);
        } catch (error) {
            console.log(error);
            console.log(getStackTrace(error));
        }
    }

module.exports = {
    lint,
    warn
};
