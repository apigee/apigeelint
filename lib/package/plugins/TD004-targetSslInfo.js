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

const ruleId = require("../myUtil.js").getRuleId();

const plugin = {
  ruleId,
  name: "TargetEndpoint HTTPTargetConnection SSLInfo",
  message: "TargetEndpoint HTTPTargetConnection should use SSLInfo.",
  fatal: false,
  severity: 1,  // 1 = warn, 2 = error
  nodeType: "Endpoint",
  enabled: true
};

const path = require('path'),
      util = require('util'),
      debug = require("debug")("apigeelint:" + ruleId);

const onTargetEndpoint =
  function(endpoint, cb) {
    let htc = endpoint.getHTTPTargetConnection(),
        shortFilename = path.basename(endpoint.getFileName()),
        flagged = false;

    debug(`onTargetEndpoint shortfile(${shortFilename})`);
    if (htc) {
      try {
        let sslInfos = htc.select('SSLInfo');
        debug(`onTargetEndpoint sslInfos(${util.format(sslInfos)})`);
        let messages = [];
        if (sslInfos.length == 0) {
          messages.push(`Missing SSLInfo configuration`);
        }
        else if (sslInfos.length != 1) {
          messages.push(`Incorrect SSLInfo configuration`);
        }

        if( ! messages.length) {
          let elts = htc.select(`SSLInfo/Enabled`);
          let enabled = elts && elts[0] && elts[0].childNodes && elts[0].childNodes[0] &&
            elts[0].childNodes[0] == 'true';
          if ( ! enabled) {
            messages.push('SSLInfo configuration is not Enabled');
          }

          elts = htc.select(`SSLInfo/IgnoreValidationErrors`);
          let ignoreErrors = elts && elts[0] && elts[0].childNodes && elts[0].childNodes[0] &&
            elts[0].childNodes[0] == 'true';
          if (ignoreErrors) {
            messages.push('SSLInfo configuration includes IgnoreValidationErrors = true');
          }

          elts = htc.select(`SSLInfo/TrustStore`);
          let hasTrustStore = elts && (elts.length == 1) && elts[0].childNodes && elts[0].childNodes[0];
          if ( ! hasTrustStore) {
            messages.push('Missing TrustStore in SSLInfo');
          }

          elts = htc.select(`SSLInfo/ClientAuthEnabled`);
          let hasClientAuth = elts && (elts.length == 1) && elts[0].childNodes && elts[0].childNodes[0] &&
            elts[0].childNodes[0] == 'true';

          // check for keystore, keyalias
          elts = htc.select(`SSLInfo/KeyStore`);
          let hasKeyStore = elts && (elts.length == 1) && elts[0].childNodes && elts[0].childNodes[0];
          elts = htc.select(`SSLInfo/KeyAlias`);
          let hasKeyAlias = elts && (elts.length == 1) && elts[0].childNodes && elts[0].childNodes[0];

          if ( hasClientAuth && (! hasKeyStore || ! hasKeyAlias)) {
            messages.push('When ClientAuthEnabled = true, use a KeyStore and KeyAlias');
          }
          if ( ! hasClientAuth && (hasKeyStore || hasKeyAlias)) {
            messages.push('When ClientAuthEnabled = false, do not use a KeyStore and KeyAlias');
          }
        }

        //debug(`onTargetEndpoint messages(${messages})`);
        messages.forEach(message => {
          endpoint.addMessage({
            plugin,
            line: htc.getElement().lineNumber,
            column: htc.getElement().columnNumber,
            message
          });
          debug(`onTargetEndpoint set flagged`);
          flagged = true;
        });
      }
      catch (exc1) {
        console.error('exception: ' + exc1);
        debug(`onTargetEndpoint exc(${exc1})`);
        debug(`${exc1.stack}`);
      }

    }

    if (typeof(cb) == 'function') {
        debug(`onTargetEndpoint isFlagged(${flagged})`);
      cb(null, flagged );
    }
  };

module.exports = {
  plugin,
  onTargetEndpoint
};
