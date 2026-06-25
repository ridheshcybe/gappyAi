import lemma from "../lemma-config.js";
import incidentSchema from "../schemas/incident-schema.json" with { type: 'json' };;

const incidentStore = lemma.datastore("incidents", {
  schema: incidentSchema,
  indexing: true,
  indexes: [
    {
      field: "classification.severity",
      type: "string",
    },
    {
      field: "classification.affectedComponent",
      type: "string",
    },
    {
      field: "timestamp",
      type: "datetime",
    },
  ],
});

export default incidentStore;