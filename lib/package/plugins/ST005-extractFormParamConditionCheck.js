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

//extractFormParamConditionCheck
//| &nbsp; |:white_medium_square:| ST005 | Extract Variables with FormParam |  A check for a body element must be performed before policy execution. |

const ruleId = require("../lintUtil.js").getRuleId(),
      debug = require("debug")("apigeelint:" + ruleId),
      xpath = require("xpath");

const plugin = {
        ruleId,
        name: "Extract Variables with FormParam",
        message:
        "For the ExtractVariables step, an appropriate check for a message body was not found on the enclosing Step or Flow.",
        fatal: false,
        severity: 1, //1=warning, 2=error
        nodeType: 'Step',
        enabled: true
      };

const stringNonNullCheckRegexp = (source) => `\\(? *\\b${source}\\b *(!=|NotEquals|IsNot) *(\"\"|null) *\\)?`;

const messageCheckRegexp = (source) => stringNonNullCheckRegexp(`${source}.formstring`);
const paramCheckRegexp = (source, name) => stringNonNullCheckRegexp(`${source}.formparam.${name}`);

const exampleFormstringCondition = (source, params) => `${source}.formstring != null`;
const exampleParamCondition =
  (source, params) => params.map(name => `${source}.formparam.${name} != null`).join(' || ');

const isSufficient =
  function(condition, source, paramNames) {
    let exp = condition.getExpression();
    debug(`isSufficient cond(${exp})`);
    let retval = exp.match(messageCheckRegexp(source)) ||
      paramNames.some( name => exp.match(paramCheckRegexp(source, name)));
    debug(`> isSufficient() ${ !!retval}`);
    return retval;
  };

const check =
  function(endpoint) {
    let flagged = false;
    let bundlePolicies = endpoint.parent.getPolicies();

    endpoint.getSteps().forEach( step => {
      let referredPolicy = bundlePolicies.find( p => p.getSteps().find(s => s == step));
      if ( !referredPolicy || referredPolicy.getType() !== "ExtractVariables") {
        return;
      }
      debug('found an attached ExtractVariables policy');
      let formParam = xpath.select(
            `/ExtractVariables/FormParam/text()`,
            referredPolicy.getElement()
          );
      if (formParam.length == 0) {
        debug(`no extract from FormParam`);
        return;
      }
      debug(`extracts from FormParam (${formParam.length})`);
      let paramNames = xpath.select(`/ExtractVariables/FormParam/@name`,referredPolicy.getElement() )
        .map( attr => attr.value);

      debug(`param names: (${paramNames})`);
      let sourceElement = xpath.select(
            "/ExtractVariables/Source/text()",
            referredPolicy.getElement()
          );

      let source = "will.be.replaced";
      if (sourceElement && sourceElement.length) {
        source = sourceElement[0].data;
      }
      else {
        // source is empty, ∴ implicitly use "message"
        debug(`Source element is empty`);
        source = 'message';
      }

      let condition = step.getCondition();
      if (condition && isSufficient(condition, source, paramNames)) {
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
            if (isSufficient(condition, source, paramNames)) {
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
      let policyName = xpath.select1('/ExtractVariables/@name', referredPolicy.getElement()).value;
      endpoint.addMessage({
        plugin,
        source: step.getElement().toString(),
        line: step.getElement().lineNumber,
        column: step.getElement().columnNumber,
        message: `For the ExtractVariables step (${policyName}), an appropriate check for a message body was not found. For example, use <Condition>${exampleFormstringCondition(source)}</Condition> or <Condition>${exampleParamCondition(source, paramNames)}</Condition>`
      });

    });

    return flagged;
  };

const onProxyEndpoint = function(endpoint, cb) {
        debug('onProxyEndpoint');
        let flagged = check(endpoint);
        if (typeof(cb) == 'function') {
          cb(null, flagged);
        }
      };

const onTargetEndpoint = function(endpoint, cb) {
        debug('onTargetEndpoint');
        let flagged = check(endpoint);
        if (typeof(cb) == 'function') {
          cb(null, flagged);
        }
      };

module.exports = {
  plugin,
  onProxyEndpoint,
  onTargetEndpoint
};
