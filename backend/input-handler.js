import { v4 as uuid } from "uuid";
import docStore from "./stores/document-store.js";
import { validateRawAlert } from "./utils/validate-raw-alert.js";

async function ingestAlert({
  source,
  payload,
  metadata = {},
}) {
  const alert = {
    id: `alert_${uuid()}`,
    source,
    payload,
    metadata,
    receivedAt: new Date().toISOString(),
  };

  const validation = validateRawAlert(alert);

  if (!validation.isValid) {
    throw new Error(
      JSON.stringify(validation.errors)
    );
  }

  await docStore.save(
    alert.id,
    JSON.stringify(alert)
  );

  return alert.id;
}

export { ingestAlert };