// profile.js
// ------------------------------------------------------------------

/* jshint esversion:9, node:true, strict:implied */
/* global describe, it */

const assert = require("assert"),
      path = require("path"),
      bl = require("../../lib/package/bundleLinter.js");

describe(`PO026 - PropertySetRef with --profile 'apigeex' for PO026-apigeex-proxy`, () => {
  it('should NOT generate errors for ProperSetRef', () => {
    let configuration = {
          debug: true,
          source: {
            type: "filesystem",
            path: path.resolve(__dirname, '../fixtures/resources/PO026-apigeex-proxy/apiproxy'),
            bundleType: "apiproxy"
          },
          excluded: {},
          setExitCode: false,
          output: () => {}, // suppress output
          profile: "apigeex"
        };

    bl.lint(configuration, (bundle) => {
      let items = bundle.getReport();
      assert.ok(items);
      assert.ok(items.length);
      items.forEach( (item) => {
        // console.log( item );
        if( item.filePath === "/apiproxy/policies/AM-config-properties.xml") {
            assert.equal(item.errorCount,0);
        }
      });
    });
  });
});

describe(`PO026 - PropertySetRef with --profile 'apigee' for PO026-apigeex-proxy`, () => {
  it('should generate errors for ProperSetRef', () => {
    let configuration = {
          debug: true,
          source: {
            type: "filesystem",
            path: path.resolve(__dirname, '../fixtures/resources/PO026-apigeex-proxy/apiproxy'),
            bundleType: "apiproxy"
          },
          excluded: {},
          setExitCode: false,
          output: () => {}, // suppress output
          profile: "apigee"
        };

    bl.lint(configuration, (bundle) => {
      let items = bundle.getReport();
      assert.ok(items);
      assert.ok(items.length);
      items.forEach( (item) => {
        // console.log( item );
        if( item.filePath === "/apiproxy/policies/AM-config-properties.xml") {
            assert.equal(item.errorCount,6);
        }
      });
    });
  });
});

const testID = "PO026",
      Policy = require("../../lib/package/Policy.js"),
      Dom = require("@xmldom/xmldom").DOMParser,
      fs = require("fs"),
      plugin = require(bl.resolvePlugin(testID));

const resourceUrlTest =
  (suffix, profile, cb) => {
    let filename = `AM-AssignVariable-${suffix}.xml`;
    it(`should correctly process ${filename} for profile ${profile}`, () => {
      let fqfname = path.resolve(__dirname, '../fixtures/resources/PO026-assignVariable-resourceUrl', filename),
          policyXml = fs.readFileSync(fqfname, 'utf-8'),
          doc = new Dom().parseFromString(policyXml),
          p = new Policy(doc.documentElement, this);

      p.getElement = () => doc.documentElement;

      plugin.onBundle({profile});
      plugin.onPolicy(p, (e, foundIssues) => {
        assert.equal(e, undefined, "should be undefined");
        cb(p, foundIssues);
      });
    });
  };


describe(`PO026 - AssignVariable with ResourceURL`, () => {

  resourceUrlTest('1', 'apigeex', (p, foundIssues) => {
    assert.equal(foundIssues, false);
    assert.ok(p.getReport().messages, "messages undefined");
    assert.equal(p.getReport().messages.length, 0, JSON.stringify(p.getReport().messages));
  });

  resourceUrlTest('1', 'apigee', (p, foundIssues) => {
    assert.equal(foundIssues, true);
    assert.ok(p.getReport().messages, "messages undefined");
    assert.equal(p.getReport().messages.length, 2);
    assert.ok(p.getReport().messages[0].message.indexOf("stray element")>0);
    assert.ok(p.getReport().messages[1].message.indexOf("You should have at least one of")>=0);
  });

});
