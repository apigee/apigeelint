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

const xpath = require("xpath"),
      util = require('util'),
      ruleId = require("../myUtil.js").getRuleId(),
      debug = require("debug")("apigeelint:" + ruleId);

const plugin = {
        ruleId,
        name: "ExpirySettings",
        fatal: false,
        severity: 1, // warning
        nodeType: "Policy",
        enabled: true
      };

const policyTypesOfInterest = ['ResponseCache', 'PopulateCache'];

const isPolicyOfInterest = p => policyTypesOfInterest.find(name => name == p.getType());

const onPolicy = function(policy, cb) {
        let flagged = false;
        const addMessage = (line, column, message) => {
                policy.addMessage({plugin, message, line, column});
                flagged = true;
              };
        try {
          let ofInterest = isPolicyOfInterest(policy);
          if (ofInterest) {
            const expiryNodes = xpath.select(`/${ofInterest}/ExpirySettings`, policy.getElement());
            if (expiryNodes && expiryNodes.length>0) {
              let foundValid = 0;
              //console.log(util.format(policy));
              debug(`${policy.fileName} found ${expiryNodes.length} ExpirySettings elements`);
              if (expiryNodes.length>1) {
                expiryNodes.slice(1).forEach( node =>
                                              addMessage(node.lineNumber, node.columnNumber, "extraneous ExpirySettings element"));
              }

              const expiryNode = expiryNodes[0];
              //debug(`node: ` + util.format(expiryNode));
              const oldTimeoutNodes = xpath.select('TimeoutInSec', expiryNode);
              //debug(`${policy.fileName} found ${oldTimeoutNodes.length} TimeoutInSec elements`);
              if (oldTimeoutNodes && oldTimeoutNodes.length>0) {
                foundValid++;
                oldTimeoutNodes.forEach( node =>
                                         addMessage(node.lineNumber, node.columnNumber, "TimeoutInSec is deprecated; use TimeoutInSeconds"));
              }

              const timeoutNodes = xpath.select('TimeoutInSeconds', expiryNode);
              if (timeoutNodes && timeoutNodes.length>0) {
                foundValid++;
                if (timeoutNodes.length>1) {
                  timeoutNodes.slice(1).forEach( node =>
                                                 addMessage(node.lineNumber, node.columnNumber, "extraneous TimeoutInSeconds element"));
                }
                else {
                  let text = xpath.select('text()', timeoutNodes[0]);
                  text = text && text[0] && text[0].data;
                  if (text) {
                  let intValue = parseInt(text, 10);
                  if (intValue > 86400 * 30) {
                    addMessage(timeoutNodes[0].lineNumber, timeoutNodes[0].columnNumber, "value for TimeoutInSeconds is too long");
                  }
                  }
                }
              }

              const todNodes = xpath.select('TimeOfDay', expiryNode);
              if (todNodes && todNodes.length>0) {
                foundValid++;
                if (todNodes.length>1) {
                  todNodes.slice(1).forEach( node =>
                                                 addMessage(node.lineNumber, node.columnNumber, "extraneous TimeOfDay element"));
                }
              }

              const dateNodes = xpath.select('ExpiryDate', expiryNode);
              if (dateNodes && dateNodes.length>0) {
                foundValid++;
                if (dateNodes.length>1) {
                  dateNodes.slice(1).forEach( node =>
                                              addMessage(node.lineNumber, node.columnNumber, "extraneous ExpiryDate element"));
                }
                else {
                  // try to parse the date
                  let text = xpath.select('text()', dateNodes[0]);
                  text = text && text[0] && text[0].data;
                  if (text) {
                    debug('ExpiryDate/text: ' + text);
                    // format should be mm-dd-yyyy
                    let parts = text.split("-");
                    if (parts && parts.length == 3) {
                      let [mm, dd, yyyy] = parts;
                      if ((yyyy.length != 4) || (mm.length != 2) || (dd.length != 2)) {
                        addMessage(dateNodes[0].lineNumber, dateNodes[0].columnNumber, "seems like an invalid date format in ExpiryDate");
                      }
                      let d = new Date(parseInt(yyyy, 10),
                                       parseInt(mm, 10) - 1,
                                       parseInt(dd, 10));
                      debug('resolves to: ' + d.toISOString());
                      if (isNaN(d.getTime())) {
                        addMessage(dateNodes[0].lineNumber, dateNodes[0].columnNumber, "invalid date format in ExpiryDate");
                      }
                    }
                    else {
                      addMessage(dateNodes[0].lineNumber, dateNodes[0].columnNumber, "invalid date format in ExpiryDate");
                    }
                  }
                }
              }

              if (foundValid == 0) {
                addMessage(expiryNode.lineNumber, expiryNode.columnNumber, "missing child of ExpirySettings");
              }
              if (foundValid > 1) {
                addMessage(expiryNode.lineNumber, expiryNode.columnNumber, "multiple children of ExpirySettings");
              }
            }
            else {
              debug(`${policy.fileName} found no ExpirySettings elements`);
              addMessage(0, 0, "found no ExpirySettings element");
            }
          }

          if (typeof(cb) == 'function') {
            cb(null, flagged);
          }
        }
        catch(e) {
          debug(util.format(e));
        }
      };

module.exports = {
  plugin,
  onPolicy
};
