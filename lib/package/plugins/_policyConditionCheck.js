/*
  Copyright 2019-2022 Google LLC

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

const xpath = require("xpath");

const stringNonNullCheckRegexp = (source) => `\\(? *\\b${source}\\b *(!=|NotEquals|IsNot) *(\"\"|null) *\\)?`;

const messageCheckRegexp = (source) => stringNonNullCheckRegexp(`${source}.content`);

const checkFactory = (plugin, policyType, debug) =>
  function(endpoint) {
    let flagged = false;
    let bundlePolicies = endpoint.parent.getPolicies();

    endpoint.getSteps().forEach( step => {
      let referredPolicy = bundlePolicies.find( p => p.getSteps().find(s => s == step));
      if ( ! referredPolicy || referredPolicy.getType() !== policyType) {
        return;
      }
      debug(`found an attached ${policyType} policy`);
      let sourceElement = xpath.select(
            `/${policyType}/Source/text()`,
            referredPolicy.getElement()
          );

      let condRegExp = "will.be.replaced";
      if (sourceElement && sourceElement.length) {
        let source = sourceElement[0].data;
        condRegExp = messageCheckRegexp(source?source:'message');
      }
      else {
        // source is empty, ∴ implicitly use "message"
        debug(`Source element is empty`);
        condRegExp = messageCheckRegexp('message');
      }

      let condition = step.getCondition();
      if (condition && condition.getExpression().match(condRegExp)) {
        debug('sufficient condition');
        return;
      }
      debug('did not find sufficient condition on step, checking parent...');
      let parent = step.parent;
      if (parent) {
        if (parent.getType() === "FlowPhase") {
          debug(`parent phase: ${parent.getPhase()}`);
          parent = parent.parent;
        }
      }
      if (parent) {
        if (parent.getType() === "Flow") {
          condition = parent.getCondition();
          if (condition) {
            debug(`parent cond expression: [${condition.getExpression()}]`);
            if (condition.getExpression().match(condRegExp)) {
              debug('parent has sufficient condition');
              return true;
            }
            debug('parent does not have sufficient condition');
          }
          else {
            debug(`no Condition on parent`);
          }
        }
      }
      else {
        debug(`no parent?`);
      }

      debug('missing or insufficient condition');
      flagged = true;
      let policyName = xpath.select1(`/${policyType}/@name`, referredPolicy.getElement()).value;

      endpoint.addMessage({
        plugin,
        source: step.getElement().toString(),
        line: step.getElement().lineNumber,
        column: step.getElement().columnNumber,
        message:
        `For the ${policyType} step (${policyName}), an appropriate check for a message body was not found.`
      });

    });

    return flagged;
  };



module.exports = checkFactory;
