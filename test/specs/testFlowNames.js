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

const assert = require("assert"),
      debug = require("debug")("apigeelint:flowNames"),
      Endpoint = require("../../lib/package/Endpoint.js"),
      Dom = require("xmldom").DOMParser,
      test = function(exp, assertion) {
        it("testing flow names ", function() {
          var result = [],
              doc = new Dom().parseFromString(exp),
              ep = new Endpoint(doc, this,"/dummy/test/apiproxy/proxies/foo.xml"),
              flows = ep.getFlows();

          flows.forEach(function(f) {
            result.push(f.getName());
          });
          assert.deepEqual(
            result,
            assertion,
            result ? "names did not match" : "names matched"
          );
        });
      };

describe("FlowNames", function() {

  test(
    `
  <ProxyEndpoint name="default">
  <Flows>
                <Flow name="condition1">
              <Description>This is condition 1</Description>
              <Request>
                  <Step>
                        <Name>jsCalculate</Name>
                  </Step>
              </Request>
              <Response>
              </Response>
              <Condition>(request.verb = "GET") and (proxy.pathsuffix MatchesPath "/condition1")</Condition>
          </Flow>
                <Flow name="condition2">
              <Description>This is condition 2</Description>
              <Request>
                  <Step>
                        <Name>jsCalculateFromContext</Name>
                  </Step>
              </Request>
              <Response>
              </Response>
              <Condition>(request.verb = "GET") and (proxy.pathsuffix MatchesPath "/condition2")</Condition>
          </Flow>
    </Flows>
    </ProxyEndpoint>
  `,
    ["condition1", "condition2"]
  );

});
