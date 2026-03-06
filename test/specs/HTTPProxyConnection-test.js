/*
  Copyright © 2026 Google LLC

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

const assert = require("node:assert"),
  Dom = require("@xmldom/xmldom").DOMParser,
  HTTPProxyConnection = require("../../lib/package/HTTPProxyConnection.js");

describe("HTTPProxyConnection", function () {
  it("Should correctly parse a full HTTPProxyConnection element", function () {
    const xml = `
      <HTTPProxyConnection name="my-connection">
        <BasePath>/v1/foo</BasePath>
        <Properties>
          <Property name="prop1">val1</Property>
          <Property name="prop2">val2</Property>
        </Properties>
      </HTTPProxyConnection>`;
    const doc = new Dom().parseFromString(xml);
    const hpc = new HTTPProxyConnection(doc.documentElement, null);

    assert.equal(hpc.getType(), "HTTPProxyConnection");
    assert.equal(hpc.getName(), "my-connection");
    assert.equal(hpc.getBasePath(), "/v1/foo");

    const props = hpc.getProperties();
    assert.equal(props.prop1, "val1");
    assert.equal(props.prop2, "val2");

    const summary = hpc.summarize();
    assert.equal(summary.name, "my-connection");
    assert.equal(summary.basePath, "/v1/foo");
  });

  it("Should handle missing attributes and elements", function () {
    const xml = `<HTTPProxyConnection/>`;
    const doc = new Dom().parseFromString(xml);
    const hpc = new HTTPProxyConnection(doc.documentElement, null);

    assert.equal(hpc.getName(), "");
    assert.equal(hpc.getBasePath(), undefined);
    assert.deepEqual(hpc.getProperties(), {});
  });

  it("Should handle empty BasePath", function () {
    const xml = `
      <HTTPProxyConnection>
        <BasePath></BasePath>
      </HTTPProxyConnection>`;
    const doc = new Dom().parseFromString(xml);
    const hpc = new HTTPProxyConnection(doc.documentElement, null);

    assert.equal(hpc.getBasePath(), "");
  });

  it("Should handle Properties with no children", function () {
    const xml = `
      <HTTPProxyConnection>
        <Properties/>
      </HTTPProxyConnection>`;
    const doc = new Dom().parseFromString(xml);
    const hpc = new HTTPProxyConnection(doc.documentElement, null);

    assert.deepEqual(hpc.getProperties(), {});
  });

  it("Should handle malformed Property elements gracefully", function () {
    const xml = `
      <HTTPProxyConnection>
        <Properties>
          <Property>ValueOnly</Property>
          <Property name="NameOnly"></Property>
          <Property name="Full">Value</Property>
        </Properties>
      </HTTPProxyConnection>`;
    const doc = new Dom().parseFromString(xml);
    const hpc = new HTTPProxyConnection(doc.documentElement, null);

    const props = hpc.getProperties();
    // The current implementation (line 58) checks for childNodes, attributes[0], AND childNodes[0]
    // <Property>ValueOnly</Property> -> prop.attributes[0] is undefined -> skipped
    // <Property name="NameOnly"></Property> -> prop.childNodes[0] is undefined -> skipped
    // <Property name="Full">Value</Property> -> all present -> included
    assert.equal(props.Full, "Value");
    assert.equal(Object.keys(props).length, 1);
  });
});
