import Ajv from "ajv";
const schema = require("./incident-schema.json");

const ajv = new Ajv({
  allErrors: true,
});

const validate = ajv.compile(schema);

function isValidIncident(data) {
  const valid = validate(data);

  if (!valid) {
    console.error(validate.errors);
    return false;
  }

  return true;
}

export { isValidIncident };