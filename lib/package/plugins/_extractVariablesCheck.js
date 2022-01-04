/*
  Copyright 2019-2021 Google LLC

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

const stringNonNullCheckRegexp = (source) => `${source} *(!=|NotEquals|IsNot) *(\"\"|null)`;

const messageCheckRegexp = (source) => stringNonNullCheckRegexp(`(${source}\.content|${source}.formstring)`);

module.exports = {
  check : (plugin, payloadType, debug) =>
  function(policy, cb) {
    let reKnownMessages = "^(request|response|message)$";
    let condRegExp = "will.be.replaced";

    let flagged = false;
    if (policy.getType() === "ExtractVariables") {
      debug('found ExtractVariables policy');
      if (policy.getSteps().length > 0) {
        debug(`policy has ${policy.getSteps().length} steps`);
        let payload = xpath.select(
              `/ExtractVariables/${payloadType}/text()`,
              policy.getElement()
            );

        if (payload.length > 0) {
          debug(`is ${payloadType}`);

          let sourceElement = xpath.select(
                "/ExtractVariables/Source/text()",
                policy.getElement()
              );

          if (sourceElement.length) {
            let source = sourceElement[0].data;
            if (source.match(reKnownMessages)) {
              condRegExp = messageCheckRegexp(source);
            }
            else {
              // source is either a custom message, or a plain json string.
              // Look for a check for either of those.
              condRegExp = `(${messageCheckRegexp(source)}|${stringNonNullCheckRegexp(source)})`;
            }
          }
          else {
            // source is empty, ∴ implicitly use "message"
            condRegExp = messageCheckRegexp('message');
          }

          debug(`condRegExp: ${condRegExp}`);
          condRegExp = `^${condRegExp}$`;

          let hasBodyChecks =
            policy.getSteps().every(step => {
              // let util = require('util');
              // debug('step ' + util.format(step));
              let condition = step.getCondition();
              if (condition) {
                debug(`cond expression: [${condition.getExpression()}]`);
              }
              else {
                debug('no Condition');
              }
              if (condition && condition.getExpression().trim().match(condRegExp)) {
                debug('sufficient condition');
                return true;
              }

              let parent = step.parent;
              if (parent && parent.getType() === "FlowPhase") {
                parent = parent.parent;
              }
              if (parent && parent.getType() === "Flow") {
                debug('parent is Flow');
                condition = step.parent.getCondition();
                debug(`parent cond expression: [${condition.getExpression()}]`);
                if (condition && condition.getExpression().trim().match(condRegExp)) {
                  debug('parent has sufficient condition');
                  return true;
                }
              }
              debug('missing or insufficient condition');
              return false;
            });

          if ( ! hasBodyChecks) {
            flagged = true;
            policy.addMessage({
              plugin,
              message:
              "An appropriate check for a message body was not found on the enclosing Step or Flow."
            });
          }
        }
        else {
          debug('not a XMLPayload');
        }
      }
      else {
        debug('not attached');

      }
    }
    if (typeof(cb) == 'function') {
      cb(null, flagged);
    }
  }
};
