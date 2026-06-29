export default {
  $schema: "http://json-schema.org/draft-07/schema#",

  title: "RawAlert",

  type: "object",

  properties: {
    id: {
      type: "string",
    },

    source: {
      type: "string",
    },

    payload: {
      type: "string",
    },

    receivedAt: {
      type: "string",
      format: "date-time",
    },

    metadata: {
      type: "object",
    },
  },

  required: [
    "id",
    "source",
    "payload",
    "receivedAt",
  ],
};