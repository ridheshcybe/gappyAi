// frontend/src/lib/api.js
// Default matches backend's fallback port (index.js: PORT = process.env.PORT || 4321)
// Override via VITE_API_URL env var for production / Docker
const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:4321";

async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

export async function ingestAlert(
  data
) {
  const res = await fetch(
    `${API_URL}/api/ingest`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(
        data
      ),
    }
  );

  return handleResponse(res);
}

export async function triageAlert(
  alertId
) {
  const res = await fetch(
    `${API_URL}/api/triage/${alertId}`,
    {
      method: "POST",
    }
  );

  return handleResponse(res);
}

export async function getIncidents() {
  const res = await fetch(
    `${API_URL}/api/incidents`
  );

  return res.json();
}

// Copilot API
export async function copilotChat(incidentId, message, conversation = []) {
  const res = await fetch(
    `${API_URL}/api/copilot/chat`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        incidentId,
        message,
        conversation,
      }),
    }
  );

  return res.json();
}

export async function getCopilotConversation(incidentId) {
  const res = await fetch(
    `${API_URL}/api/copilot/conversation/${incidentId}`
  );

  return res.json();
}

// History API
export async function getIncidentHistory(incidentId) {
  const res = await fetch(
    `${API_URL}/api/incidents/${incidentId}/history`
  );

  return res.json();
}

// Activity API
export async function getActivityFeed(limit = 50) {
  const res = await fetch(
    `${API_URL}/api/activity?limit=${limit}`
  );

  return res.json();
}

export async function getIncidentActivity(incidentId) {
  const res = await fetch(
    `${API_URL}/api/activity/${incidentId}`
  );

  return res.json();
}

export async function postActivity(data) {
  const res = await fetch(
    `${API_URL}/api/activity`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  return res.json();
}

// Assignment API
export async function recommendAssignee(incidentId) {
  const res = await fetch(
    `${API_URL}/api/incidents/${incidentId}/assignee`
  );

  return res.json();
}

export async function assignIncident(incidentId, assignee, reason) {
  const res = await fetch(
    `${API_URL}/api/incidents/${incidentId}/assign`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        assignee,
        reason,
      }),
    }
  );

  return res.json();
}

// Post-mortem API
export async function generatePostMortem(incidentId) {
  const res = await fetch(
    `${API_URL}/api/incidents/${incidentId}/postmortem`,
    {
      method: "POST",
    }
  );

  return res.json();
}

export async function getPostMortem(incidentId) {
  const res = await fetch(
    `${API_URL}/api/incidents/${incidentId}/postmortem`
  );

  return res.json();
}

// Executive API
export async function getExecutiveMetrics() {
  const res = await fetch(
    `${API_URL}/api/executive/metrics`
  );

  return res.json();
}

// Topology API
export async function getTopology() {
  const res = await fetch(`${API_URL}/api/topology`);
  return res.json();
}