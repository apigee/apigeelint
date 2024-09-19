/*
  Copyright 2019-2020,2024 Google LLC

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

const ruleId = require("../myUtil.js").getRuleId(),
  debug = require("debug")("apigeelint:" + ruleId),
  xpath = require("xpath");

const ELEMENT_NODE = 1;
//const ATTRIBUTE_NODE = 2;
const TEXT_NODE = 3;
const CDATA_SECTION_NODE = 4;

const plugin = {
  ruleId,
  name: "Check for duplicate policies",
  message: "Multiple identically configured policies.",
  fatal: false,
  severity: 1, // 1=warning, 2=error
  nodeType: "Endpoint",
  enabled: true
};

const onBundle = function (bundle, cb) {
  debug("onBundle");
  const flagged = check(bundle);
  if (typeof cb == "function") {
    cb(null, flagged);
  }
};

const _markPolicy = (policy, msg) =>
  policy.addMessage({
    ruleId: plugin.ruleId,
    severity: plugin.severity,
    source: policy.getSource(),
    line: policy.getElement().lineNumber,
    column: policy.getElement().columnNumber,
    nodeType: "Policy",
    message: msg
  });

/*
 * Recursive fn that returns true if XML elements are different. Ignores any intervening whitespace or indents.
 *
 **/
const _diffXmlNode = (isTopLevel) => (indent, elt1, elt2) => {
  debug(`${indent}elt1: TYPE(${elt1.nodeType}) tag(${elt1.tagName})`);
  debug(`${indent}elt2: TYPE(${elt2.nodeType}) tag(${elt2.tagName})`);
  // verify same node type
  if (elt1.nodeType != elt2.nodeType) {
    debug(`${indent}different nodeType`);
    return true;
  }

  if (elt1.nodeType == TEXT_NODE) {
    debug(
      `${indent}test '${elt1.nodeValue.trim()}' ==? '${elt2.nodeValue.trim()}'`
    );
    return elt1.nodeValue.trim() != elt2.nodeValue.trim();
  }

  if (elt1.nodeType == CDATA_SECTION_NODE) {
    debug(`${indent}test '${elt1.data}' ==? '${elt2.data}'`);
    return elt1.data != elt2.data;
  }

  if (elt1.nodeType == ELEMENT_NODE) {
    // compare tagname on element nodes
    debug(`${indent}test '${elt1.tagName}' ==? '${elt2.tagName}'`);
    if (elt1.tagName != elt2.tagName) {
      return true;
    }

    // compare attrs, maybe excepting name
    const attrsToCompare = (elt) => {
      let attrs = xpath.select("@*", elt);
      if (isTopLevel) {
        attrs = attrs.filter((attr) => attr.name != "name");
      }
      return attrs;
    };

    // compare attrs without respect to ordering
    const attrs1 = attrsToCompare(elt1);
    const attrs2 = attrsToCompare(elt2);
    let diff =
      attrs1.length != attrs2.length ||
      !!attrs1.find(
        (attr1, _i) =>
          !attrs2.find(
            (attr2) => attr2.name == attr1.name && attr2.value == attr1.value
          )
      );

    // compare child nodes, respecting ordering
    if (!diff) {
      const childrenToCompare = (elt) =>
        xpath
          .select("node()|text()", elt)
          .filter(
            (node) =>
              node.nodeType == ELEMENT_NODE ||
              node.nodeType == TEXT_NODE ||
              node.nodeType == CDATA_SECTION_NODE
          );
      const children1 = childrenToCompare(elt1);
      const children2 = childrenToCompare(elt2);

      if (
        children1.length == children2.length &&
        children2.length == 1 &&
        children2[0].nodeType == TEXT_NODE
      ) {
        diff = children1[0].nodeValue.trim() != children2[0].nodeValue.trim();
      } else {
        debug(`${indent}recurse`);
        /*
         * It is too simplistic to use the lengths of the node sets as a basis of
         * difference.  If there is a comment in one of the documents, and not in the other,
         * it results in multiple text nodes in one of the nodesets and just one in the
         * other. Instead, we effectively ignore toplevel text nodes in either
         * document. This is ok, as there are no cases in which Apigee uses complex XML in
         * which a child nodeset includes both TEXT nodes and elements.  In other words, in
         * all valid Apigee configuration, if the node is an element, it either has a single
         * TEXT child, or it has one or more element children. Never both.
         **/
        const reducer = (a) => (accumulator, elt, _index) => {
          // if they are already different, skip all further checks
          if (!accumulator.different) {
            // skip all TEXT nodes in children1
            if (elt.nodeType != TEXT_NODE) {
              // likewise, skip all successive TEXT nodes in children2
              let ix2 = accumulator.ix2;
              while (a[ix2] && a[ix2].nodeType == TEXT_NODE) {
                ix2++;
              }
              const elt2 = a[ix2];
              debug(`${indent} elt2: ${elt2}`);
              accumulator.different =
                !elt2 || _diffXmlNode(false)(indent + "  ", elt, elt2);
              accumulator.ix2 = ++ix2;
            }
          }
          return accumulator;
        };

        const result = children1.reduce(reducer(children2), {
          ix2: 0,
          different: false
        });
        diff = result.different;
      }
    }
    return diff;
  }
  throw new Error("unhandled node type");
};

/*
 * Returns true if XML elements are different. This ignores the toplevel name attribute,
 * and any intervening whitespace or indents.
 *
 **/
const diffXml = (elt1, elt2) => _diffXmlNode(true)("", elt1, elt2);

const _checkForDuplicatePolicies = (policies) => {
  const xpath = "/*/*";
  let flagged = false;
  /**
   * Check each policy for duplicates.
   *
   * This sort of works, but it's naive in that it compares the XML
   * configuration directly, including whitespace. A better comparison would
   * ignore whitespace and just compare the digest of the XML.  That is an
   * unrealizable dream as the digest is determined by how Apigee interprets
   * the XML. We might be able to get close by comparing the XML infoset.
   *
   **/
  const previouslyDetected = [];

  policies.slice(0, -1).forEach((policy1, i, a) => {
    if (!previouslyDetected.includes(i)) {
      try {
        //const p1 = policy1.select(xpath).toString().trim();
        debug(
          `looking at index ${i}: type(${policy1.getType()}) name(${policy1.getName()})`
        );
        const dupesForI = [];
        a.slice(i + 1).forEach((c, j) => {
          // debug(`  comparing to ${c}...`);
          if (!diffXml(policy1.getElement(), c.getElement())) {
            const actualIndex = j + i + 1;
            debug(`    duplicate found at index ${actualIndex}`);
            dupesForI.push(actualIndex);
          }
        });

        if (dupesForI.length) {
          debug(`    dupes found for ${i}: ${dupesForI}`);
          dupesForI.forEach((ix) =>
            _markPolicy(
              policies[ix],
              `Policy ${policies[ix].getName()} is a duplicate of Policy ${policies[i].getName()}. Eliminate duplicates and attach a single policy in multiple places.`
            )
          );
          flagged = true;
          previouslyDetected.push(...dupesForI);
          debug(`\n  dupes found so far: ${previouslyDetected}`);
        }
      } catch (e) {
        console.log(e.stack);
        _markPolicy(
          policy1,
          `Error processing Policy ${policy1.getName()}: ${e.message}.`
        );
        flagged = true;
      }
    }
  });
  return flagged;
};

const check = (bundle) => {
  let flagged = false;
  if (bundle.policies) {
    debug("number of policies: " + bundle.policies.length);
    if (bundle.policies.length > 1) {
      flagged = _checkForDuplicatePolicies(
        bundle.policies.toSorted((a, b) =>
          a.getName().localeCompare(b.getName())
        )
      );
    }
  }
  return flagged;
};

module.exports = {
  plugin,
  onBundle
};
