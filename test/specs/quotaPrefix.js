// quotaPrefix.js
// ------------------------------------------------------------------
//
// created: Mon Nov 16 17:03:04 2020
// last saved: <2020-November-16 17:42:37>

/* jshint esversion:9, node:true, strict:implied */
/* global process, console, Buffer, describe, it */

const testID = "PO007",
      assert = require("assert"),
      bl = require("../../lib/package/bundleLinter.js"),
      plugin = require(bl.resolvePlugin(testID)),
      Policy = require("../../lib/package/Policy.js"),
      Dom = require("xmldom").DOMParser;

const policyXmlTemplate = '<Quota async="false" continueOnError="false" enabled="true" name="@@PREFIX@@-Enforce">\n' +
      '   <Identifier ref="client_id"/>\n' +
      '   <Allow countRef="apiproduct.developer.quota.limit" count="10000"/>\n' +
      '   <Interval ref="apiproduct.developer.quota.interval">1</Interval>\n' +
      '   <TimeUnit ref="apiproduct.developer.quota.timeunit">month</TimeUnit>\n' +
      '   <Distributed>true</Distributed>\n' +
      '   <Synchronous>true</Synchronous>\n' +
      '</Quota>\n';

const test = (expectSuccess) =>
  (prefix) => {
    it(`allows acceptable prefix(${prefix})`, () => {
      let policyXml = policyXmlTemplate.replace('@@PREFIX@@', prefix),
          doc = new Dom().parseFromString(policyXml),
          p = new Policy(doc.documentElement, this);

      p.getElement = () => doc.documentElement;

      plugin.onPolicy(p, (e, foundIssues) => {
        assert.equal(e, undefined, "should be undefined");
        if (expectSuccess) {
          assert.equal(foundIssues, false);
          assert.ok(p.getReport().messages, "messages undefined");
          assert.equal(p.getReport().messages.length, 0, JSON.stringify(p.getReport().messages));
        }
        else {
          assert.equal(foundIssues, true);
          assert.ok(p.getReport().messages, "messages undefined");
          assert.equal(p.getReport().messages.length, 1, "unexpected number of messages");
          assert.ok(p.getReport().messages[0].message, 'did not find message member');
          assert.equal(p.getReport().messages[0].message, `Non-standard prefix (${prefix}). Valid prefixes for Quota include: ["quota","q"]`);
        }
      });
    });
  };

const positiveCase = test(true);
const negativeCase = test(false);

describe(`PO007 - QuotaPolicyPrefix`, () => {

  positiveCase('Q');
  positiveCase('Quota');
  positiveCase('QUOTA');

  negativeCase('unQ');

});
