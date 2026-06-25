import triageAgent from "./agents/triage-agent.js";
import docStore from "./stores/document-store.js";
import incidentStore from "./stores/datastore.js";
import router from "./alert-router.js";
import { isValidIncident } from "./schemas/validator.js";
import { emitIncident } from "./socket.js";
import { v4 as uuidv4 } from "uuid";
import rootCauseAgent from "./agents/root-cause-agent.js";
import runbookAgent from "./agents/runbook-agent.js";
import notificationAgent from "./agents/notification-agent.js";
import historyService from "./services/history-service.js";
import activityService from "./services/activity-service.js";

export async function triageIncident(alertId) {
  console.log(
    `📥 Processing ${alertId}`
  );

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

  // Stage 2: Root Cause Analysis
  const rootCause = await rootCauseAgent.analyze(triaged);
  addTimelineEvent("Root Cause Analysis Complete");

  // Stage 3: Runbook Generation
  const runbook = await runbookAgent.generate(triaged, rootCause);
  addTimelineEvent("Runbook Generated");

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
    throw new Error(
      "Incident schema invalid"
    );
  }

  addTimelineEvent("Validated");

  // Stage 6: Persist
  await incidentStore.save(
    incident.incidentId,
    incident
  );
  addTimelineEvent("Stored");

  // Stage 6b: Historical similarity
  const similar = await historyService.findSimilar(incident, 5);
  const historySummary = await historyService.summarizeHistory(similar);
  incident.history = historySummary;
  await incidentStore.save(
    incident.incidentId,
    incident
  );
  addTimelineEvent("History Linked");

  // Index for future lookups (fire and forget after resolution)
  // Or index immediately for live similarity:
  historyService.indexIncident(incident).catch(err =>
    console.error('History indexing failed:', err)
  );

  // Stage 7: Notification (async, non-blocking)
  notificationAgent.format(incident, rootCause, runbook, 'slack')
    .then(notification => {
      // Update incident with notification
      incident.notification = notification;
      return incidentStore.save(
        incident.incidentId,
        incident
      );
    })
    .catch(err => console.error('Notification failed:', err));
  // Note: We don't await this to keep it non-blocking
  addTimelineEvent("Notification Queued");

  // Stage 8: Severity routing
  const routingResult =
    await router.routeIncident(
      incident
    );
  addTimelineEvent("Routed");

  // Final update with completed timeline
  await incidentStore.save(
    incident.incidentId,
    incident
  );

  // Emit via WebSocket
  emitIncident(incident);

  return {
    incident,
    routingResult,
  };
}
