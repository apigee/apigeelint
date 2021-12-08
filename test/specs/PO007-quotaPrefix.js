// quotaPrefix.js
// ------------------------------------------------------------------
//
// created: Mon Nov 16 17:03:04 2020
// last saved: <2021-December-07 14:20:16>

/* jshint esversion:9, node:true, strict:implied */
/* global describe, it */

const testID = "PO007",
      assert = require("assert"),
      bl = require("../../lib/package/bundleLinter.js"),
      plugin = require(bl.resolvePlugin(testID)),
      Policy = require("../../lib/package/Policy.js"),
      Dom = require("@xmldom/xmldom").DOMParser;

const policyXmlTemplate = '<Quota name="@@PNAME@@">\n' +
      '   <Identifier ref="client_id"/>\n' +
      '   <Allow countRef="apiproduct.developer.quota.limit" count="10000"/>\n' +
      '   <Interval ref="apiproduct.developer.quota.interval">1</Interval>\n' +
      '   <TimeUnit ref="apiproduct.developer.quota.timeunit">month</TimeUnit>\n' +
      '   <Distributed>true</Distributed>\n' +
      '   <Synchronous>true</Synchronous>\n' +
      '</Quota>\n';

const test = (expectSuccess) =>
  (policyName) => {
    it(`allows acceptable policyName(${policyName})`, () => {
      let policyXml = policyXmlTemplate.replace('@@PNAME@@', policyName),
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
          assert.equal(p.getReport().messages[0].message, `Non-standard name for policy (${policyName}). Valid prefixes for the Quota policy: ["quota","q"]. Valid patterns: ["^q$","^quota$"].`);
        }
      });
    });
  };

const positiveCase = test(true);
const negativeCase = test(false);

describe(`PO007 - QuotaPolicyPrefix`, () => {

  positiveCase('Q-Enforce');
  positiveCase('Quota-Enforce');
  positiveCase('QUOTA-1');
  positiveCase('Q');
  positiveCase('Quota');

  negativeCase('unQ-Enforce');
  negativeCase('NotQuota');

});
