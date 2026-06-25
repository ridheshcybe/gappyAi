import Ajv from "ajv";
import schema from "../schemas/raw-alert.schema.js";

const ajv = new Ajv({
  allErrors: true,
});

// Add custom format for date-time
ajv.addFormat('date-time', /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/);

const validate = ajv.compile(schema);

function validateRawAlert(data) {
  const valid = validate(data);

  return {
    isValid: valid,
    errors: validate.errors || null,
  };
}

export { validateRawAlert };