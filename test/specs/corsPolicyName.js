// corsPolicyName.js
// ------------------------------------------------------------------

/* jshint esversion:9, node:true, strict:implied */
/* global describe, it */

const testID = "PO007",
      assert = require("assert"),
      fs = require("fs"),
      path = require("path"),
      bl = require("../../lib/package/bundleLinter.js"),
      plugin = require(bl.resolvePlugin(testID)),
      Policy = require("../../lib/package/Policy.js"),
      Dom = require("@xmldom/xmldom").DOMParser;

const test =
  (filename, cb) => {
    it(`should correctly process ${filename}`, () => {
      let fqfname = path.resolve(__dirname, '../fixtures/resources/PO007-cors-policy', filename),
          policyXml = fs.readFileSync(fqfname, 'utf-8'),
          doc = new Dom().parseFromString(policyXml),
          p = new Policy(doc.documentElement, this);

      p.getElement = () => doc.documentElement;

      plugin.onPolicy(p, (e, foundIssues) => {
        assert.equal(e, undefined, "should be undefined");
        cb(p, foundIssues);
      });
    });
  };

describe(`PO007 - CORS policy name`, () => {

  test('CORS-1.xml', (p, foundIssues) => {
    assert.equal(foundIssues, false);
    assert.ok(p.getReport().messages, "messages undefined");
    assert.equal(p.getReport().messages.length, 0, JSON.stringify(p.getReport().messages));
  });

  test('AM-CORS-1.xml', (p, foundIssues) => {
    assert.equal(foundIssues, true);
    assert.ok(p.getReport().messages, "messages undefined");
    assert.equal(p.getReport().messages.length, 1, "unexpected number of messages");
    assert.ok(p.getReport().messages[0].message, 'did not find message member');
    assert.equal(p.getReport().messages[0].message, 'Non-standard prefix (AM). Valid prefixes for CORS include: ["cors"]');
  });

});
