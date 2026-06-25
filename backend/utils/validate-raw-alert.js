import Ajv from "ajv";
import schema from "../schemas/raw-alert.schema.js";

const ajv = new Ajv({
  allErrors: true,
});

const validate = ajv.compile(schema);

function validateRawAlert(data) {
  const valid = validate(data);

  return {
    isValid: valid,
    errors: validate.errors || null,
  };
}

export { validateRawAlert };