import triageAgent from "./agents/triage-agent.js";
import docStore from "./stores/document-store.js";
import incidentStore from "./stores/datastore.js";
import router from "./alert-router.js";
import { isValidIncident } from "./schemas/validator.js";
import { emitIncident, emitTriageProgress } from "./socket.js";
import { v4 as uuidv4 } from "uuid";
import rootCauseAgent from "./agents/root-cause-agent.js";
import runbookAgent from "./agents/runbook-agent.js";

import historyService from "./services/history-service.js";
import activityService from "./services/activity-service.js";

export async function triageIncident(alertId) {
  console.log(
    `📥 Processing ${alertId}`
  );

  try {
    return await runPipeline(alertId);
  } catch (err) {
    emitTriageProgress(alertId, "error", 0, `Triage failed: ${err.message}`);
    throw err;
  }
}

async function runPipeline(alertId) {
  const raw = await docStore.fetch(
    alertId
  );

  if (!raw) {
    throw new Error(
      "Alert not found"
    );
  }

  const alert = JSON.parse(raw);

  // Generate correlation ID for this incident
  const correlationId = alertId || uuidv4();
  const timeline = [];

  // Helper to add timeline events
  const addTimelineEvent = (event) => {
    timeline.push({ event, timestamp: new Date().toISOString() });
  };

  addTimelineEvent("Alert Received");

  emitTriageProgress(alertId, "triage", 10, "Starting AI triage analysis…");

  // Stage 1: AI Triage
  const triageResult =
    await triageAgent.run({
      input: alert.payload,
      context: {
        source: alert.source,
        receivedAt:
          alert.receivedAt,
      },
    });

  let triaged;

  try {
    triaged = JSON.parse(
      triageResult.text
    );
  } catch {
    throw new Error(
      "AI returned invalid JSON"
    );
  }

  addTimelineEvent("AI Triage Complete");
  emitTriageProgress(alertId, "root-cause", 35, "AI triage complete. Analyzing root cause…");

  // Stage 2: Root Cause Analysis
  const rootCause = await rootCauseAgent.analyze(triaged);
  addTimelineEvent("Root Cause Analysis Complete");
  emitTriageProgress(alertId, "runbook", 55, "Root cause identified. Generating remediation runbook…");

  // Stage 3: Runbook Generation
  const runbook = await runbookAgent.generate(triaged, rootCause);
  addTimelineEvent("Runbook Generated");
  emitTriageProgress(alertId, "validate", 75, "Runbook ready. Validating incident schema…");

  // Stage 4: Build structured incident matching the schema
  const incident = {
    incidentId: correlationId,
    id: correlationId,
    timestamp: new Date().toISOString(),
    classification: {
      severity: triaged.severity,
      affectedComponent: triaged.affectedComponent,
      errorCategory: triaged.errorCategory,
    },
    triageAnalysis: {
      headline: triaged.headline,
      rootCauseInferred: triaged.rootCauseInferred,
      userImpactDescription: triaged.userImpactDescription,
    },
    rootCause,
    runbook,
    remediationRunbook: {
      status: runbook?.summary ? "runbook-ready" : "pending",
      suggestedSteps: runbook?.immediateActions?.map(a => a.action) || [],
      draftedNotification: runbook?.summary || "",
    },
    timeline: [],
    status: "open",
    severity: triaged.severity,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    confidenceScore: Math.round(
      ((triaged.confidenceScore || 0) + (rootCause.confidence || 0)) / 2
    )
  };

  // Add the timeline we built
  incident.timeline = timeline;

  // Stage 5: Validate
  const valid =
    isValidIncident(
      incident
    );

  if (!valid) {
    emitTriageProgress(alertId, "error", 0, "Incident schema validation failed");
    throw new Error(
      "Incident schema invalid"
    );
  }

  addTimelineEvent("Validated");
  emitTriageProgress(alertId, "store", 82, "Incident validated. Storing…");

  // Stage 6: Persist
  await incidentStore.save(
    incident.incidentId,
    incident
  );
  addTimelineEvent("Stored");
  emitTriageProgress(alertId, "history", 88, "Incident stored. Linking historical context…");

  // Stage 6b: Historical similarity
  const similar = await historyService.findSimilar(incident, 5);
  const historySummary = await historyService.summarizeHistory(similar);
  incident.history = historySummary;
  await incidentStore.save(
    incident.incidentId,
    incident
  );
  addTimelineEvent("History Linked");
  emitTriageProgress(alertId, "route", 94, "History linked. Routing to appropriate team…");

  // Index for future lookups (fire and forget after resolution)
  // Or index immediately for live similarity:
  historyService.indexIncident(incident).catch(err =>
    console.error('History indexing failed:', err)
  );

  // Stage 7: Severity routing
  const routingResult =
    await router.routeIncident(
      incident
    );
  addTimelineEvent("Routed");
  emitTriageProgress(alertId, "finalize", 97, "Routing complete. Finalizing incident…");

  // Final update with completed timeline
  await incidentStore.save(
    incident.incidentId,
    incident
  );

  // Emit via WebSocket
  emitIncident(incident);
  emitTriageProgress(alertId, "complete", 100, "Triage complete!");

  return {
    incident,
    routingResult,
  };
}
