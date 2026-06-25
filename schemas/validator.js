import Ajv from 'ajv';
import schema from './incident-schema.json' with { type: 'json' };;

const ajv = new Ajv();
const validate = ajv.compile(schema);

function isValidIncident(data) {
  const valid = validate(data);
  if (!valid) console.error(validate.errors);
  return valid;
}

export default { isValidIncident };
