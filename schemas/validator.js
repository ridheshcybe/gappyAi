const Ajv = require('ajv');
const schema = require('./incident-schema.json');

const ajv = new Ajv();
const validate = ajv.compile(schema);

function isValidIncident(data) {
  const valid = validate(data);
  if (!valid) console.error(validate.errors);
  return valid;
}

module.exports = { isValidIncident };
