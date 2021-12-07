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

module.exports = (plugin, typename, condRegExp, debug) =>
  function(policy, cb) {
  let flagged = false;
  if (policy.getType() === typename) {
    debug(`found ${typename} policy`);
    if (policy.getSteps().length > 0) {
      let missingBodyCheck = false,
          steps = policy.getSteps();

      steps.forEach(function(step) {
        let condition = step.getCondition();
        if (!condition || !condition.getExpression().match(condRegExp)) {
          if (step.parent && step.parent.getType() === "Flow") {
            let condition = step.parent.getCondition();
            if ( ! condition || !condition.getExpression().match(condRegExp)) {
              debug('condition insufficient, and parent condition missing or insufficient');
              missingBodyCheck = true;
            }
            else {
              debug('condition insufficient, but parent condition is sufficient');
            }
          }
          else {
            debug('no condition or insufficient condition');
            missingBodyCheck = true;
          }
        }
        else {
          debug('condition looks good');
        }
      });

      if (missingBodyCheck) {
        flagged = true;
        policy.addMessage({
          plugin,
          message:
            "An appropriate check for a message body was not found on the enclosing Step or Flow."
        });
      }
    }
    else {
      debug('not attached');
    }
  }
  if (typeof(cb) == 'function') {
    cb(null, flagged);
  }
};
