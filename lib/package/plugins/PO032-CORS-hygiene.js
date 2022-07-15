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

const xpath = require("xpath"),
      util = require('util'),
      ruleId = require("../myUtil.js").getRuleId(),
      debug = require("debug")("apigeelint:" + ruleId);

const plugin = {
        ruleId,
        name: "CORS/hygiene",
        fatal: false,
        severity: 1, // warning
        nodeType: "Policy",
        enabled: true
      };

function checkAllowOrigins(policy, addMessage) {
  const nodeset = xpath.select("/CORS/AllowOrigins", policy.getElement());
  if (nodeset.length>0) {
    debug(`${policy.fileName} found ${nodeset.length} AllowOrigins elements`);
    if (nodeset.length>1) {
      nodeset.slice(1).forEach( node =>
                                addMessage(node.lineNumber, node.columnNumber, "extraneous AllowOrigins element"));
    }
    // check the 1st element (ideally it is the only one)
    let elt = nodeset[0],
    originsText = xpath.select1('text()', elt);
    originsText = originsText && originsText.data.trim();
    let origins = originsText && originsText.split(',').map(x => x.trim()) || [];
    origins.forEach( o => {
      if (o) {
        if (o.trim() == '*') {
          if (origins.length == 1) {
            addMessage(elt.lineNumber, elt.columnNumber, "using a wildcard for AllowOrigins defeats the purpose of CORS.");
          }
          else {
            addMessage(elt.lineNumber, elt.columnNumber, "do not use a wildcard for AllowOrigins as well as other specific origins.");
          }
        }
        else if (o.endsWith('/')) {
          addMessage(elt.lineNumber, elt.columnNumber, "The Origin should not end with a slash.");
        }
        else if (o == '{request.header.origin}') {
          addMessage(elt.lineNumber, elt.columnNumber, "Using {request.header.origin} in AllowOrigins defeats the purpose of CORS.");
        }
      }
    });
  }
  else {
    debug(`${policy.fileName} found no AllowOrigins elements`);
    addMessage(policy.getElement().lineNumber, policy.getElement().columnNumber, "There is no AllowOrigins element. All cross-origin requests will fail.");
  }
}

function checkAllowCredentials(policy, addMessage) {
  const nodeset1 = xpath.select("/CORS/AllowCredentials", policy.getElement());
  if (nodeset1.length>0) {
    debug(`${policy.fileName} found ${nodeset1.length} AllowCredentials elements`);
    if (nodeset1.length>1) {
      nodeset1.slice(1).forEach( node =>
                                addMessage(node.lineNumber, node.columnNumber, "extraneous AllowCredentials element"));
    }

    // check the first one, ideally it is the only one
    let elt = nodeset1[0],
        allowText = xpath.select1('text()', elt);
    allowText = allowText && allowText.data.trim();
    if ( ! allowText) {
      addMessage(elt.lineNumber, elt.columnNumber, "missing value for AllowCredentials element.");
    }
    else if (allowText != 'false' && allowText != 'true') {
      addMessage(elt.lineNumber, elt.columnNumber, "invalid value for AllowCredentials element.");
    }
  }
  // else {
  //   debug(`${policy.fileName} found no AllowCredentials elements`);
  //   // I had a belief that if there is an AllowHeaders that specifies Authorization,
  //   // and no AllowCredentials element, the user agent would reject. But that's not so.
  //   const nodeset2 = xpath.select("/CORS/AllowHeaders", policy.getElement());
  //   if (nodeset2.length == 1) {
  //     let elt = nodeset2[0],
  //         headerText = xpath.select1('text()', elt),
  //         headers = headerText.split(',').map(x => x.trim());
  //     headers.forEach( h => {
  //       if (h.toLowerCase() == 'authorization') {
  //         // not sure if this is true, to be verified
  //         addMessage(elt.lineNumber, elt.columnNumber,
  //                    `If you specify ${h} in AllowHeaders, you must also specify <AllowCredentials>true</AllowCredentials>.`);
  //       }
  //     });
  //   }
  // }
}

function checkAllowHeaders(policy, addMessage) {
   checkHeadersElement('Allow', policy, addMessage) ;
}
function checkExposeHeaders(policy, addMessage) {
   checkHeadersElement('Expose', policy, addMessage) ;
}

function checkHeadersElement(verb, policy, addMessage) {
  const elementName = `${verb}Headers`; // AllowHeaders, ExposeHeaders
  const nodeset = xpath.select(`/CORS/${elementName}`, policy.getElement());
  if (nodeset.length>0) {
    debug(`${policy.fileName} found ${nodeset.length} ${elementName} elements`);
    if (nodeset.length>1) {
      nodeset.slice(1).forEach( node =>
                                addMessage(node.lineNumber, node.columnNumber, `extraneous ${elementName} element`));
    }
    else {
      // there is exactly one
      let elt = nodeset[0],
          allowText = xpath.select1('text()', elt);
      allowText = allowText && allowText.data.trim();
      if ( ! allowText) {
        addMessage(elt.lineNumber, elt.columnNumber, `missing value for ${elementName} element.`);
      }
      else {
        let headers = allowText.split(',').map(x => x.trim()) || [];
        headers.forEach( h => {
          if ( ! h || h.indexOf(' ')>0) {
            addMessage(elt.lineNumber, elt.columnNumber, `The value in the ${elementName} element is misformatted.`);
          }
          else if (h == '*' && headers.length != 0){
            addMessage(elt.lineNumber, elt.columnNumber, `Do not use a wildcard as well as specific values in the ${elementName} element.`);
          }
        });
      }
    }
  }
}

function checkAllowMethods(policy, addMessage) {
  const nodeset = xpath.select("/CORS/AllowMethods", policy.getElement());
  if (nodeset.length>0) {
    debug(`${policy.fileName} found ${nodeset.length} AllowMethods elements`);
    if (nodeset.length>1) {
      nodeset.slice(1).forEach( node =>
                                addMessage(node.lineNumber, node.columnNumber, "extraneous AllowMethods element"));
    }

    // check the first one, ideally it is the only one
    let elt = nodeset[0],
        allowText = xpath.select1('text()', elt);
    allowText = allowText && allowText.data.trim();
    if ( ! allowText) {
      addMessage(elt.lineNumber, elt.columnNumber, "missing value for AllowMethods element.");
    }
    else {
      let methods = allowText.split(',').map(x => x.trim()) || [];
      methods.forEach( m => {
        if ( ! m || m.indexOf(' ')>0) {
          addMessage(elt.lineNumber, elt.columnNumber, "The value in the AllowMethods element is misformatted.");
        }
      });
    }
  }
}

const onPolicy = function(policy, cb) {
        let flagged = false;
        const addMessage = (line, column, message) => {
                policy.addMessage({plugin, message, line, column});
                flagged = true;
              };
        if (policy.getType() === "CORS") {
          checkAllowOrigins(policy, addMessage);
          checkAllowCredentials(policy, addMessage);
          checkAllowHeaders(policy, addMessage);
          checkAllowMethods(policy, addMessage);
          checkExposeHeaders(policy, addMessage);
        }
        if (typeof(cb) == 'function') {
          cb(null, flagged);
        }
      };

module.exports = {
  plugin,
  onPolicy
};
