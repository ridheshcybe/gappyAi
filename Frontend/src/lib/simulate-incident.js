/**
 * simulateIncident – Creates a fully-formed simulated incident and makes it
 * available everywhere (Dashboard, Incidents pages).
 *
 * Stores the incident in localStorage under `secureops_demo_incidents` and
 * dispatches a `walkthrough:incident-created` custom event so any open page
 * can pick it up in real time.
 *
 * Returns the created incident object.
 */
export function simulateIncident({
  title = 'Untriaged Incident',
  service = 'Unknown Service',
  severity = 'P1',
  symptoms = [],
} = {}) {
  const sevMap = {
    P0: 'P0_CRITICAL',
    P1: 'P1_HIGH',
    P2: 'P2_MEDIUM',
    P3: 'P3_LOW',
  };
  const fullSeverity = sevMap[severity] || 'P1_HIGH';
  const headline =
    title ||
    symptoms[0] ||
    `${service} – ${severity} alert`;

  const incident = {
    incidentId: `demo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    id: `demo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    status: 'open',
    severity: fullSeverity,
    classification: {
      severity: fullSeverity,
      affectedComponent: service,
      errorCategory: symptoms[0] ? symptoms[0].split(' ').slice(0, 3).join(' ') : 'Alert',
    },
    triageAnalysis: {
      headline,
      rootCauseInferred: `Primary cause traced to ${service} — ${symptoms[0] || 'unexpected behaviour detected'}.`,
      userImpactDescription: symptoms.slice(0, 2).join('. ') || `${severity} severity impact detected across affected users.`,
    },
    confidenceScore: 85 + Math.floor(Math.random() * 15),
    remediationRunbook: {
      suggestedSteps: [
        `Increase ${service} resource allocation`,
        'Restart affected service pods',
        'Verify dependent service health',
        'Monitor recovery for 10 minutes',
      ],
    },
    timeline: [
      { event: 'Alert Received', timestamp: new Date(Date.now() - 60000 * 2).toISOString() },
      { event: 'AI Triage Complete', timestamp: new Date(Date.now() - 60000 * 1).toISOString() },
      { event: 'Root Cause Analysis', timestamp: new Date().toISOString() },
    ],
    createdAt: new Date().toISOString(),
    source: 'chaos-panel',
  };

  // Persist to localStorage
  try {
    const existing = JSON.parse(localStorage.getItem('secureops_demo_incidents') || '[]');
    existing.unshift(incident);
    // Keep max 20
    if (existing.length > 20) existing.length = 20;
    localStorage.setItem('secureops_demo_incidents', JSON.stringify(existing));
  } catch {
    // Ignore storage errors
  }

  // Dispatch event so all open pages see it
  window.dispatchEvent(
    new CustomEvent('walkthrough:incident-created', { detail: incident })
  );

  return incident;
}

/**
 * Load demo incidents from localStorage.
 */
export function getDemoIncidents() {
  try {
    return JSON.parse(localStorage.getItem('secureops_demo_incidents') || '[]');
  } catch {
    return [];
  }
}

/**
 * Merge API incidents with localStorage demo incidents, deduped by id.
 */
export function mergeIncidents(apiIncidents = []) {
  const demos = getDemoIncidents();
  const apiIds = new Set(
    apiIncidents.map((i) => i.incidentId || i.id)
  );
  const newDemos = demos.filter((d) => !apiIds.has(d.incidentId || d.id));
  return [...newDemos, ...apiIncidents];
}
