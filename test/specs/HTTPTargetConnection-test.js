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
  HTTPTargetConnection = require("../../lib/package/HTTPTargetConnection.js");

describe("HTTPTargetConnection", function () {
  it("Should correctly parse a full HTTPTargetConnection element", function () {
    const xml = `
      <HTTPTargetConnection name="my-target">
        <URL>https://api.example.com/v1</URL>
        <Properties>
          <Property name="prop1">val1</Property>
          <Property name="prop2">val2</Property>
        </Properties>
      </HTTPTargetConnection>`;
    const doc = new Dom().parseFromString(xml);
    const htc = new HTTPTargetConnection(doc.documentElement, null);

    assert.equal(htc.getType(), "HTTPTargetConnection");
    assert.equal(htc.getName(), "my-target");
    assert.equal(htc.getURL(), "https://api.example.com/v1");

    const props = htc.getProperties();
    assert.equal(props.prop1, "val1");
    assert.equal(props.prop2, "val2");

    const summary = htc.summarize();
    assert.equal(summary.name, "my-target");
    assert.equal(summary.url, "https://api.example.com/v1");
  });

  it("Should handle missing attributes and elements", function () {
    const xml = `<HTTPTargetConnection/>`;
    const doc = new Dom().parseFromString(xml);
    const htc = new HTTPTargetConnection(doc.documentElement, null);

    assert.equal(htc.getName(), "");
    assert.equal(htc.getURL(), undefined);
    assert.deepEqual(htc.getProperties(), {});
  });

  it("Should handle empty URL", function () {
    const xml = `
      <HTTPTargetConnection>
        <URL></URL>
      </HTTPTargetConnection>`;
    const doc = new Dom().parseFromString(xml);
    const htc = new HTTPTargetConnection(doc.documentElement, null);

    assert.equal(htc.getURL(), "");
  });

  it("Should handle Properties with no children", function () {
    const xml = `
      <HTTPTargetConnection>
        <Properties/>
      </HTTPTargetConnection>`;
    const doc = new Dom().parseFromString(xml);
    const htc = new HTTPTargetConnection(doc.documentElement, null);

    assert.deepEqual(htc.getProperties(), {});
  });

  it("Should handle malformed Property elements gracefully", function () {
    const xml = `
      <HTTPTargetConnection>
        <Properties>
          <Property>ValueOnly</Property>
          <Property name="NameOnly"></Property>
          <Property name="Full">Value</Property>
        </Properties>
      </HTTPTargetConnection>`;
    const doc = new Dom().parseFromString(xml);
    const htc = new HTTPTargetConnection(doc.documentElement, null);

    const props = htc.getProperties();
    // In HTTPTargetConnection.js, we now have safety checks.
    // <Property>ValueOnly</Property> -> no attributes -> skipped
    // <Property name="NameOnly"></Property> -> no child nodes -> skipped
    // <Property name="Full">Value</Property> -> all present -> included
    assert.equal(props.Full, "Value");
    assert.equal(Object.keys(props).length, 1);
  });
});
