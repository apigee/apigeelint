const assert = require("assert"),
      path = require("path"),
      Bundle = require("../../lib/package/Bundle.js");

describe("addMessage", function() {
    it("Should add a message for 'undefined' proxies", function() {
        const proxyPath = path.resolve(__dirname, '../fixtures/resources/newBundle/apiproxy');
        const configuration = {
            debug: true,
            source: {
                type: "filesystem",
                path: proxyPath,
                bundleType: "apiproxy"
            },
            profile: 'apigee',
            excluded: {},
            setExitCode: false,
            output: () => {} // suppress output
        };
    
        const message = "This is a test";
        const plugin = {
            ruleId: "TR001",
            severity: 1, //warning
            nodeType: "Bundle"
        };

        let bundle = new Bundle(configuration);
        bundle.addMessage({
            plugin,
            message: message           
        });

        bundle.getReport(report => {
            let bundleResult = report.find(element => element.filePath === proxyPath);
            assert.notEqual(bundleResult, null);
            assert.equal(bundleResult.warningCount, 1);
            let m = bundleResult.messages.find(element => element.message === message);
            assert.equal(m.ruleId, plugin.ruleId);
        });
    });
});