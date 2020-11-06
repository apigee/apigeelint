/*
  Copyright 2019-2020 Google LLC

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

/* global describe, it */

const assert = require("assert"),
      debug = require("debug")("apigeelint:flowNames"),
      util = require ('util');

const Policy = require("../../lib/package/Policy.js"),
  Dom = require("xmldom").DOMParser;

describe("PolicyNames", function() {

  let testCases = [
        { config: `<Javascript name='JS.Log.To.Stackdriver' timeLimit='400'>
  <Properties>
    <Property name='authz_header'>Bearer {stackdriver.token}</Property>
    <Property name='endpoint'>https://logging.googleapis.com/v2/entries:write</Property>
  </Properties>
  <ResourceURL>jsc://log-To-Stackdriver.js</ResourceURL>
  </Javascript>
  `,
          expectedDisplayName : null,
          expectedName : "JS.Log.To.Stackdriver"
        },
        { config: `<Javascript name='JS-Log-To-Stackdriver' timeLimit='400'>
  <Properties>
    <Property name='authz_header'>Bearer {stackdriver.token}</Property>
    <Property name='endpoint'>https://logging.googleapis.com/v2/entries:write</Property>
  </Properties>
  <ResourceURL>jsc://log-To-Stackdriver.js</ResourceURL>
  </Javascript>
  `,
          expectedDisplayName : null,
          expectedName : "JS-Log-To-Stackdriver"
        },
        { config: `<Javascript name='JS-Log-To-Stackdriver' timeLimit='400'>
  <DisplayName>foo</DisplayName>
  <Properties>
    <Property name='authz_header'>Bearer {stackdriver.token}</Property>
  </Properties>
  <ResourceURL>jsc://log-To-Stackdriver.js</ResourceURL>
  </Javascript>
  `,
          expectedDisplayName : "foo",
          expectedName : "JS-Log-To-Stackdriver"
        }
      ];

  testCases.forEach((tc, ix) => {
    it(`should return correct policy Name and DisplayName ${ix}`, function() {
      let doc = new Dom().parseFromString(tc.config),
          policy = new Policy("no-file-path", "does-not-matter.xml", this, doc);
      assert.equal(
        policy.getDisplayName(),
        tc.expectedDisplayName,
        "DisplayName did not match"
      );
      assert.equal(
        policy.getName(),
        tc.expectedName,
        "Name did not match"
      );
    });
  });


});
