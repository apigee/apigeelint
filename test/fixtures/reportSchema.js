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
  id: "eslint report",
  items: {
    id: "/items",
    properties: {
      errorCount: {
        id: "/items/properties/errorCount",
        type: "integer",
        required: true,
        optional: false
      },
      filePath: {
        id: "/items/properties/filePath",
        type: "string"
      },
      fixableErrorCount: {
        id: "/items/properties/fixableErrorCount",
        type: "integer",
        required: true,
        optional: false
      },
      fixableWarningCount: {
        id: "/items/properties/fixableWarningCount",
        type: "integer",
        required: true,
        optional: false
      },
      messages: {
        id: "/items/properties/messages",
        items: {
          id: "/items/properties/messages/items",
          properties: {
            column: {
              id: "/items/properties/messages/items/properties/column",
              type: "integer"
            },
            line: {
              id: "/items/properties/messages/items/properties/line",
              type: "integer"
            },
            message: {
              id: "/items/properties/messages/items/properties/message",
              type: "string",
              required: true,
              optional: false
            },
            nodeType: {
              id: "/items/properties/messages/items/properties/nodeType",
              type: "string"
            },
            ruleId: {
              id: "/items/properties/messages/items/properties/ruleId",
              type: "string",
              required: true,
              optional: false
            },
            severity: {
              id: "/items/properties/messages/items/properties/severity",
              type: "integer",
              enum: [0, 1, 2] //Severity should be one of the following: 0 = off, 1 = warning, 2 = error
            },
            source: {
              id: "/items/properties/messages/items/properties/source",
              type: "string"
            }
          },
          type: "object"
        },
        type: "array"
      },
      source: {
        id: "/items/properties/source",
        type: "string"
      },
      warningCount: {
        id: "/items/properties/warningCount",
        type: "integer",
        required: true,
        optional: false
      }
    },
    type: "object"
  },
  type: "array"
};
