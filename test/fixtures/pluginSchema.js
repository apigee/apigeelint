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

module.exports = {
  $schema: "http://json-schema.org/draft-04/schema#",
  definitions: {},
  id: "bundleLinter plugin schema",
  properties: {
    column: {
      id: "/properties/column",
      type: "integer",
      required: false,
      optional: false
    },
    line: {
      id: "/properties/line",
      type: "integer",
      required: false,
      optional: false
    },
    message: {
      id: "/properties/message",
      type: "string"
    },
    nodeType: {
      id: "/properties/nodeType",
      type: "string",
      required: true,
      optional: false
    },
    ruleId: {
      id: "/properties/ruleId",
      type: "string",
      required: true,
      optional: false
    },
    severity: {
      id: "/properties/severity",
      type: "integer",
      enum: [0, 1, 2], //Severity should be one of the following: 0 = off, 1 = warning, 2 = error
      required: true,
      optional: false
    },
    source: {
      id: "/properties/source",
      type: "string"
    }
  },
  type: "object"
};
