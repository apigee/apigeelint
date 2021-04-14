// assignVariableHygieneInRaiseFault.js
// ------------------------------------------------------------------

/* jshint esversion:9, node:true, strict:implied */
/* global describe, it */

const testID = "PO026",
      assert = require("assert"),
      fs = require("fs"),
      path = require("path"),
      bl = require("../../lib/package/bundleLinter.js"),
      plugin = require(bl.resolvePlugin(testID)),
      Policy = require("../../lib/package/Policy.js"),
      Dom = require("xmldom").DOMParser;

const test =
  (suffix, cb) => {
    let filename = `RF-Example-TextPlain-${suffix}.xml`;
    it(`should correctly process ${filename}`, () => {
      let fqfname = path.resolve(__dirname, '../fixtures/resources/PO026-assignVariable-in-RaiseFault', filename),
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

describe(`PO026 - AssignVariable in RaiseFault`, () => {

  test('Valid', (p, foundIssues) => {
          assert.equal(foundIssues, false);
          assert.ok(p.getReport().messages, "messages undefined");
          assert.equal(p.getReport().messages.length, 0, JSON.stringify(p.getReport().messages));
  });

  test('Invalid', (p, foundIssues) => {
    assert.equal(foundIssues, true);
    assert.ok(p.getReport().messages, "messages undefined");
    assert.equal(p.getReport().messages.length, 1, "unexpected number of messages");
    assert.ok(p.getReport().messages[0].message, 'did not find message member');
    assert.equal(p.getReport().messages[0].message, 'You should have at least one of: {Ref, Value, Template}');
  });

});
