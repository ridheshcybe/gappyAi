import Ajv from "ajv";
import incidentSchema from "./incident-schema.json" with { type: 'json' };

const ajv = new Ajv({
  allErrors: true,
});

// Add custom format for date-time
ajv.addFormat('date-time', /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/);

const validate = ajv.compile(incidentSchema);

function isValidIncident(data) {
  const valid = validate(data);

  if (!valid) {
    console.error(validate.errors);
    return false;
  }

  return true;
}

export { isValidIncident };