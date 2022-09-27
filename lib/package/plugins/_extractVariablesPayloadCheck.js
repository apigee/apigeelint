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

const messageCheckRegexp = (source) => stringNonNullCheckRegexp(`(${source}\.content|${source}.formstring)`);


class EVAttachmentChecker {
  constructor(plugin, payloadType, debug) {
    debug(`EVAttachmentChecker ctor (${payloadType})`);
    this.plugin = plugin;
    this.payloadType = payloadType; // JSONPayload or XMLPayload
    this.debug = debug;
    this.flagged = false;
    debug(`EVAttachmentChecker ctor done`);
  }

  check(endpoint) {
    let debug = this.debug;
    this.debug(`check (${endpoint.getType()})`);
    let reKnownMessages = "^(request|response|message)$";
    let flagged = false;
    let bundlePolicies = endpoint.parent.getPolicies();
    let checker = this;

    endpoint.getSteps().forEach( step => {
      let referredPolicy = bundlePolicies.find( p => p.getSteps().find(s => s == step));
      if ( !referredPolicy || referredPolicy.getType() !== "ExtractVariables") {
        return;
      }

      debug(`found an attached ExtractVariables policy, line ${step.getElement().lineNumber}`);
      let payload = xpath.select(
            `/ExtractVariables/${checker.payloadType}/text()`,
            referredPolicy.getElement()
          );

      if (payload.length == 0) {
        debug(`no extract from ${checker.payloadType}`);
        return;
      }
      debug(`extract from ${checker.payloadType}`);

      let sourceElement = xpath.select(
            "/ExtractVariables/Source/text()",
            referredPolicy.getElement()
          );

      let condRegExp = "will.be.replaced";
      if (sourceElement && sourceElement.length) {
        let source = sourceElement[0].data;
        if (source.match(reKnownMessages)) {
          condRegExp = messageCheckRegexp(source);
        }
        else {
          // source is either a custom message, or a plain json or XML string.
          // Look for a check for either of those.
          condRegExp = `(${messageCheckRegexp(source)}|${stringNonNullCheckRegexp(source)})`;
        }
      }
      else {
        // source is empty, ∴ implicitly use "message"
        debug(`Source element is empty`);
        condRegExp = messageCheckRegexp('message');
      }

      debug(`condRegExp: ${condRegExp}`);
      condRegExp = `^.*${condRegExp}.*$`;

      let condition = step.getCondition();
      debug(condition?
                `cond expression: [${condition.getExpression()}]`:
                'no Condition');

      if (condition && condition.getExpression().trim().match(condRegExp)) {
        debug('sufficient condition');
        return;
      }
      debug('did not find sufficient condition on step, checking parent...');

      // either there is a condition which is insufficient, or no condition.
      // now check the paerent - maybe a condition there.
      let parent = step.parent;
      if (parent) {
        if (parent.getType() === "FlowPhase") {
          debug(`parent type: ${parent.getType()} phase: ${parent.getPhase()}... popping up.`);
          parent = parent.parent;
        }
      }
      if (parent) {
        debug(`parent type: ${parent.getType()}`);
        if (parent.getType() === "Flow" || parent.getType() === "FaultRule") {
          debug('check parent condition');
          condition = parent.getCondition();
          if (condition) {
            debug(`parent cond expression: [${condition.getExpression()}]`);
            if (condition.getExpression().trim().match(condRegExp)) {
              debug('parent has sufficient condition');
              return;
            }
            debug('parent does not have sufficient condition');
          }
          else {
            debug(`no Condition on parent`);
          }
        }
        else {
          debug(`not checking Condition on parent`);
        }
      }
      else {
        debug(`no parent?`);
      }

      debug('missing or insufficient condition');
      flagged = true;

      endpoint.addMessage({
        plugin: checker.plugin,
        source: step.getElement().toString(),
        line: step.getElement().lineNumber,
        column: step.getElement().columnNumber,
        message:
        "For the ExtractVariables step, an appropriate check for a message body was not found on the enclosing Step or Flow."
      });

    });

    this.flagged = flagged;
    return flagged;

  }

}


module.exports = EVAttachmentChecker;
