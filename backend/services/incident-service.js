import incidentStore from "../stores/datastore.js";

async function createIncident(incident) {
  await incidentStore.save(
    incident.incidentId,
    incident
  );

  return incident;
}

async function getIncident(id) {
  return incidentStore.fetch(id);
}

async function getAllIncidents() {
  return incidentStore.query({});
}

async function updateIncident(id, data) {
  return incidentStore.update(
    id,
    data
  );
}

async function deleteIncident(id) {
  return incidentStore.delete(id);
}

export { createIncident, getIncident, getAllIncidents, updateIncident, deleteIncident };