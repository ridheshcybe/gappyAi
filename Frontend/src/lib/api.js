// frontend/src/lib/api.js
const API_URL = import.meta.env.VITE_API_URL || '';

function getToken() {
  try {
    return localStorage.getItem('secureops_auth_token');
  } catch {
    return null;
  }
}

function authHeaders() {
  const token = getToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

async function handleResponse(res) {
  // If we get a 401, clear the session — token expired or invalid
  if (res.status === 401) {
    try {
      localStorage.removeItem('secureops_auth_token');
      localStorage.removeItem('secureops_auth_user');
    } catch {}
    // Dispatch a custom event so AuthContext can react without a full page reload
    try {
      window.dispatchEvent(new CustomEvent('secureops:session-expired'));
    } catch {}
    throw new Error('Session expired. Please sign in again.');
  }
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

export async function ingestAlert(data) {
  const res = await fetch(`${API_URL}/api/ingest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function triageAlert(alertId) {
  const res = await fetch(`${API_URL}/api/triage/${alertId}`, {
    method: "POST",
    headers: { ...authHeaders() },
  });
  return handleResponse(res);
}

export async function getIncidents() {
  const res = await fetch(`${API_URL}/api/incidents`, {
    headers: { ...authHeaders() },
  });
  return handleResponse(res);
}

// Copilot API
export async function copilotChat(incidentId, message, conversation = []) {
  const res = await fetch(`${API_URL}/api/copilot/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ incidentId, message, conversation }),
  });
  return handleResponse(res);
}

export async function getCopilotConversation(incidentId) {
  const res = await fetch(`${API_URL}/api/copilot/conversation/${incidentId}`, {
    headers: { ...authHeaders() },
  });
  return handleResponse(res);
}

// History API
export async function getIncidentHistory(incidentId) {
  const res = await fetch(`${API_URL}/api/incidents/${incidentId}/history`, {
    headers: { ...authHeaders() },
  });
  return handleResponse(res);
}

// Activity API
export async function getActivityFeed(limit = 50) {
  const res = await fetch(`${API_URL}/api/activity?limit=${limit}`, {
    headers: { ...authHeaders() },
  });
  return handleResponse(res);
}

export async function getIncidentActivity(incidentId) {
  const res = await fetch(`${API_URL}/api/activity/${incidentId}`, {
    headers: { ...authHeaders() },
  });
  return handleResponse(res);
}

export async function postActivity(data) {
  const res = await fetch(`${API_URL}/api/activity`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// Assignment API
export async function recommendAssignee(incidentId) {
  const res = await fetch(`${API_URL}/api/incidents/${incidentId}/assignee`, {
    headers: { ...authHeaders() },
  });
  return handleResponse(res);
}

export async function assignIncident(incidentId, assignee, reason) {
  const res = await fetch(`${API_URL}/api/incidents/${incidentId}/assign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ assignee, reason }),
  });
  return handleResponse(res);
}

// Post-mortem API
export async function generatePostMortem(incidentId) {
  const res = await fetch(`${API_URL}/api/incidents/${incidentId}/postmortem`, {
    method: "POST",
    headers: { ...authHeaders() },
  });
  return handleResponse(res);
}

export async function getPostMortem(incidentId) {
  const res = await fetch(`${API_URL}/api/incidents/${incidentId}/postmortem`, {
    headers: { ...authHeaders() },
  });
  return handleResponse(res);
}

// Executive API
export async function getExecutiveMetrics() {
  const res = await fetch(`${API_URL}/api/executive/metrics`, {
    headers: { ...authHeaders() },
  });
  return handleResponse(res);
}

// Passkey Management API
export async function getPasskeyCredentials() {
  const res = await fetch(`${API_URL}/api/passkey/credentials`, {
    headers: { ...authHeaders() },
  });
  return handleResponse(res);
}

export async function deletePasskeyCredential(idx) {
  const res = await fetch(`${API_URL}/api/passkey/credential/${idx}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleResponse(res);
}

// Topology API
export async function getTopology() {
  const res = await fetch(`${API_URL}/api/topology`, {
    headers: { ...authHeaders() },
  });
  return handleResponse(res);
}
