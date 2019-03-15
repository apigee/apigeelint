/*
  Copyright 2019 Google LLC

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

var assert = require("assert"),
  debug = require("debug")("bundlelinter:flowNames");

var Policy = require("../../lib/package/Policy.js"),
  Dom = require("xmldom").DOMParser,
  test = function(exp, assertion) {
    it("testing policy names ", function() {
      //function Policy(path, fn, parent)
      var doc = new Dom().parseFromString(exp),
        policy = new Policy("no-file-path", "somepolicy.xml", this);

      policy.getElement = function() {
        return doc;
      };

      result = policy.getDisplayName();

      assert.deepEqual(
        result,
        assertion,
        result ? "names did not match" : "names matched"
      );
    });
  };

describe("Test Policy Names", function() {

  test(
    `<Javascript name='JS-Log-To-Stackdriver' timeLimit='400'>
  <Properties>
    <Property name='authz_header'>Bearer {stackdriver.token}</Property>
    <Property name='payload'>{
  "logName": "projects/{stackdriver.projectid}/logs/{stackdriver.logid}",
  "resource" : {
    "type": "api",
    "labels": {}
  },
  "labels": {
      "flavor": "test"
  },
  "entries": [{
      "severity" : "INFO",
      "textPayload" : "{stackdriver.logpayload}"
     }
  ],
  "partialSuccess": true
  }</Property>
    <Property name='endpoint'>https://logging.googleapis.com/v2/entries:write</Property>
  </Properties>
  <ResourceURL>jsc://log-To-Stackdriver.js</ResourceURL>
  </Javascript>
  `,
    "JS-Log-To-Stackdriver"
  );

});
