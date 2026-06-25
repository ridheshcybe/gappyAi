// backend/services/copilot-context.js
import incidentStore from '../stores/datastore.js';
import historyService from './history-service.js';

class CopilotContext {
  async build(incidentId) {
    const incident = await incidentStore.fetch(incidentId);
    if (!incident) throw new Error('Incident not found');

    const similar = await historyService.findSimilar(incident, 3);
    const history = await historyService.summarizeHistory(similar);

    return {
      incident: {
        id: incident.incidentId || incident.id,
        title: incident.triageAnalysis?.headline || incident.title,
        severity: incident.classification?.severity || incident.severity,
        service: incident.classification?.affectedComponent || incident.service,
        status: incident.status,
        symptoms: [],
        rootCause: incident.rootCause,
        runbook: incident.runbook,
        timeline: incident.timeline,
        confidence: incident.confidenceScore || incident.confidence || 0,
        createdAt: incident.createdAt
      },
      history,
      now: new Date().toISOString()
    };
  }

  formatForLLM(ctx) {
    return `
INCIDENT CONTEXT:
- Title: ${ctx.incident.title}
- Severity: ${ctx.incident.severity} | Status: ${ctx.incident.status}
- Service: ${ctx.incident.service}
- Confidence: ${ctx.incident.confidence}%
- Created: ${ctx.incident.createdAt}

SYMPTOMS:
${(ctx.incident.symptoms || []).map(s => `- ${s}`).join('\n')}

ROOT CAUSE:
${ctx.incident.rootCause?.rootCause || 'Unknown'}
Evidence: ${(ctx.incident.rootCause?.evidence || []).join(', ')}

RUNBOOK SUMMARY:
${ctx.incident.runbook?.summary || 'N/A'}
Immediate Actions:
${(ctx.incident.runbook?.immediateActions || []).map(a => `${a.step}. ${a.action}`).join('\n')}

TIMELINE:
${(ctx.incident.timeline || []).map(t => `${t.timestamp} — ${t.event}`).join('\n')}

HISTORICAL CONTEXT:
${ctx.history.seen ? `This incident type has been seen ${ctx.history.count} times before. Avg resolution: ${ctx.history.avgResolutionMin} min. Best fix: ${ctx.history.bestFix}` : 'No similar past incidents found.'}
`;
  }
}

export default new CopilotContext();
