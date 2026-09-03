/*
  Copyright 2019-2026 Google LLC

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

// This schema describes the descriptor a plugin module exports as `plugin`. It
// is not the schema of a finding; findings are described by reportSchema.js.
module.exports = {
  $schema: "http://json-schema.org/draft-04/schema#",
  definitions: {},
  id: "bundleLinter plugin schema",
  type: "object",
  required: [
    "ruleId",
    "name",
    "message",
    "fatal",
    "severity",
    "nodeType",
    "enabled",
  ],
  additionalProperties: false,
  properties: {
    ruleId: {
      id: "/properties/ruleId",
      type: "string",
      pattern: "^(EX-)?[A-Z]{2}[0-9]{3}$",
    },
    name: {
      id: "/properties/name",
      type: "string",
      minLength: 1,
    },
    // The rule-level description. Consumers display this to explain what the
    // rule checks, so it must be a sentence rather than a restatement of name.
    message: {
      id: "/properties/message",
      type: "string",
      minLength: 25,
    },
    fatal: {
      id: "/properties/fatal",
      type: "boolean",
    },
    severity: {
      id: "/properties/severity",
      type: "integer",
      enum: [0, 1, 2], //Severity should be one of the following: 0 = off, 1 = warning, 2 = error
    },
    nodeType: {
      id: "/properties/nodeType",
      type: "string",
      minLength: 1,
    },
    enabled: {
      id: "/properties/enabled",
      type: "boolean",
    },
  },
};
