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
