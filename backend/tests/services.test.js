import { describe, it, expect, beforeEach } from 'vitest';
import incidentStore from '../stores/datastore.js';

// Services use incidentStore directly, so we seed data before each test
function seedIncidents() {
  const base = {
    classification: { severity: 'P0_CRITICAL', affectedComponent: 'API Gateway', errorCategory: 'Timeout' },
    triageAnalysis: { headline: 'Test', rootCauseInferred: 'x', userImpactDescription: 'y' },
    remediationRunbook: { status: 'open', suggestedSteps: [], draftedNotification: '' },
    timestamp: new Date().toISOString(),
  };
  const incidents = [
    { ...base, incidentId: 'inc-1', status: 'open', createdAt: new Date(Date.now() - 10 * 60000).toISOString(), severity: 'P0_CRITICAL' },
    { ...base, incidentId: 'inc-2', status: 'open', createdAt: new Date(Date.now() - 5 * 60000).toISOString(), severity: 'P1_HIGH' },
    { ...base, incidentId: 'inc-3', status: 'resolved', createdAt: new Date(Date.now() - 60 * 60000).toISOString(), resolutionTimeMin: 15, severity: 'P2_MEDIUM' },
  ];
  incidents.forEach(i => incidentStore.save(i.incidentId, i));
  return incidents;
}

// ── Metrics Service ──
describe('MetricsService', () => {
  beforeEach(async () => {
    await incidentStore.clear();
  });

  it('should compute empty metrics when no incidents', async () => {
    const metricsService = (await import('../services/metrics-service.js')).default;
    const result = await metricsService.compute();
    expect(result.totalIncidents).toBe(0);
    expect(result.bySeverity.P0).toBe(0);
    expect(result.openIncidents).toBe(0);
  });

  it('should count incidents by severity', async () => {
    seedIncidents();
    const metricsService = (await import('../services/metrics-service.js')).default;
    const result = await metricsService.compute();
    expect(result.totalIncidents).toBe(3);
    expect(result.openIncidents).toBe(2);
    expect(result.resolvedIncidents).toBe(1);
  });

  it('should compute trend data', async () => {
    seedIncidents();
    const metricsService = (await import('../services/metrics-service.js')).default;
    const result = await metricsService.compute();
    expect(result.trend7d).toHaveLength(7);
    expect(result.trend7d.some(d => d.count > 0)).toBe(true);
  });

  it('should compute reliability score', async () => {
    seedIncidents();
    const metricsService = (await import('../services/metrics-service.js')).default;
    const result = await metricsService.compute();
    expect(result.reliabilityScore).toBeGreaterThanOrEqual(0);
    expect(result.reliabilityScore).toBeLessThanOrEqual(100);
  });
});

// ── Activity Service ──
describe('ActivityService', () => {
  beforeEach(async () => {
    const all = await incidentStore.query({});
    for (const i of all) await incidentStore.delete(i.incidentId);
  });

  it('should log and retrieve activity', async () => {
    const activityService = (await import('../services/activity-service.js')).default;
    const activity = await activityService.log('inc-1', 'created', 'system', { detail: 'test' });
    expect(activity.id).toBeDefined();
    expect(activity.incidentId).toBe('inc-1');
    expect(activity.type).toBe('created');

    const events = await activityService.getForIncident('inc-1');
    expect(events).toHaveLength(1);
    expect(events[0].actor).toBe('system');
  });

  it('should return empty array for incident with no activity', async () => {
    const activityService = (await import('../services/activity-service.js')).default;
    const events = await activityService.getForIncident('no-activity');
    expect(events).toEqual([]);
  });

  it('should get feed sorted by time descending', async () => {
    const activityService = (await import('../services/activity-service.js')).default;
    await activityService.log('inc-1', 'created', 'system', {});
    await new Promise(r => setTimeout(r, 10));
    await activityService.log('inc-2', 'assigned', 'user', {});

    const feed = await activityService.getFeed(10);
    expect(feed).toHaveLength(2);
    expect(feed[0].incidentId).toBe('inc-2'); // most recent first
  });

  it('should limit feed results', async () => {
    const activityService = (await import('../services/activity-service.js')).default;
    for (let i = 0; i < 5; i++) {
      await activityService.log(`inc-${i}`, 'created', 'system', {});
    }
    const limited = await activityService.getFeed(3);
    expect(limited).toHaveLength(3);
  });
});

// ── Embedding Service ──
describe('EmbeddingService', () => {
  it('should compute cosine similarity', async () => {
    const embeddingService = (await import('../services/embedding-service.js')).default;
    const a = [1, 0, 0];
    const b = [0, 1, 0];
    const c = [1, 0, 0];

    expect(embeddingService.cosineSimilarity(a, c)).toBeCloseTo(1, 5);
    expect(embeddingService.cosineSimilarity(a, b)).toBeCloseTo(0, 5);
  });

  it('should produce a 1536-dim vector (mock fallback)', async () => {
    const embeddingService = (await import('../services/embedding-service.js')).default;
    const v1 = await embeddingService.embed('test text');
    expect(Array.isArray(v1)).toBe(true);
    expect(v1.length).toBe(1536);
  });

  it('should embed incident into text', async () => {
    const embeddingService = (await import('../services/embedding-service.js')).default;
    const incident = {
      triageAnalysis: { headline: 'DB down' },
      classification: { affectedComponent: 'Database', severity: 'P0_CRITICAL' },
      rootCause: { rootCause: 'OOM', evidence: ['memory spike'], affectedComponents: ['db-primary'] },
    };
    const vector = await embeddingService.embedIncident(incident);
    expect(Array.isArray(vector)).toBe(true);
    expect(vector.length).toBe(1536);
  });
});

// ── History Service ──
describe('HistoryService', () => {
  beforeEach(async () => {
    const all = await incidentStore.query({});
    for (const i of all) await incidentStore.delete(i.incidentId);
  });

  it('should summarize empty history', async () => {
    const historyService = (await import('../services/history-service.js')).default;
    const summary = await historyService.summarizeHistory([]);
    expect(summary.seen).toBe(false);
    expect(summary.count).toBe(0);
  });

  it('should summarize matches', async () => {
    const historyService = (await import('../services/history-service.js')).default;
    const matches = [
      { id: 'h1', title: 'DB down', similarity: 0.9, resolutionTimeMin: 15, resolution: 'restart', service: 'Database' },
      { id: 'h2', title: 'DB latency', similarity: 0.8, resolutionTimeMin: 30, resolution: 'scale up', service: 'Database' },
    ];
    const summary = await historyService.summarizeHistory(matches);
    expect(summary.seen).toBe(true);
    expect(summary.count).toBe(2);
    expect(summary.avgResolutionMin).toBe(23);
    expect(summary.bestFix).toBe('restart');
  });

  it('should handle matches without resolution times', async () => {
    const historyService = (await import('../services/history-service.js')).default;
    const matches = [{ id: 'h1', title: 'Test', similarity: 0.85 }];
    const summary = await historyService.summarizeHistory(matches);
    expect(summary.seen).toBe(true);
    expect(summary.avgResolutionMin).toBe(0);
  });
});

// ── Remediation Service ──
describe('RemediationService', () => {
  beforeEach(async () => {
    const all = await incidentStore.query({});
    for (const i of all) await incidentStore.delete(i.incidentId);
  });

  it('should throw for unknown incident', async () => {
    const remediationService = (await import('../services/remediation-service.js')).default;
    await expect(remediationService.executeAction('no-exist', 'restart_service', {}))
      .rejects.toThrow('Incident not found');
  });

  it('should execute restart_service action', async () => {
    const base = {
      classification: { severity: 'P1_HIGH', affectedComponent: 'API', errorCategory: 'Timeout' },
      triageAnalysis: { headline: 'API down', rootCauseInferred: 'x', userImpactDescription: 'y' },
      remediationRunbook: { status: 'open', suggestedSteps: [], draftedNotification: '' },
    };
    await incidentStore.save('inc-rb', { ...base, incidentId: 'inc-rb', createdAt: new Date().toISOString() });
    const remediationService = (await import('../services/remediation-service.js')).default;
    const result = await remediationService.executeAction('inc-rb', 'restart_service', { service: 'API Gateway' });
    expect(result.success).toBe(true);
    expect(result.log).toContain('Successfully restarted');
  });

  it('should resolve an incident', async () => {
    const base = {
      classification: { severity: 'P1_HIGH', affectedComponent: 'API', errorCategory: 'Timeout' },
      triageAnalysis: { headline: 'API down', rootCauseInferred: 'x', userImpactDescription: 'y' },
      remediationRunbook: { status: 'open', suggestedSteps: [], draftedNotification: '' },
    };
    await incidentStore.save('inc-resolve', { ...base, incidentId: 'inc-resolve', createdAt: new Date().toISOString() });
    const remediationService = (await import('../services/remediation-service.js')).default;
    const result = await remediationService.executeAction('inc-resolve', 'resolve_incident', { note: 'Fixed' });
    expect(result.success).toBe(true);
    expect(result.resolved).toBe(true);

    const incident = await incidentStore.fetch('inc-resolve');
    expect(incident.status).toBe('resolved');
    expect(incident.resolution).toBe('Fixed');
  });
});

// ── Topology Service ──
describe('TopologyService', () => {
  beforeEach(async () => {
    const all = await incidentStore.query({});
    for (const i of all) await incidentStore.delete(i.incidentId);
  });

  it('should return topology with no incidents', async () => {
    const topologyService = (await import('../services/topology-service.js')).default;
    const result = await topologyService.getIncidentMap();
    expect(result.topology.nodes).toHaveLength(7);
    expect(result.impactedServices).toEqual([]);
  });

  it('should map incidents to affected services', async () => {
    const base = {
      classification: { severity: 'P0_CRITICAL', affectedComponent: 'Auth Service', errorCategory: 'Timeout' },
      triageAnalysis: { headline: 'Gateway down', rootCauseInferred: 'x', userImpactDescription: 'y' },
      remediationRunbook: { status: 'open', suggestedSteps: [], draftedNotification: '' },
      rootCause: { affectedComponents: ['redis'] },
    };
    await incidentStore.save('inc-topo', { ...base, incidentId: 'inc-topo' });
    const topologyService = (await import('../services/topology-service.js')).default;
    const result = await topologyService.getIncidentMap();
    expect(result.impactedServices).toContain('auth');
    expect(result.impactedServices).toContain('redis');
    expect(result.incidentMap['auth']).toBeDefined();
  });
});

// ── Escalation Service ──
describe('EscalationService', () => {
  beforeEach(async () => {
    const all = await incidentStore.query({});
    for (const i of all) await incidentStore.delete(i.incidentId);
  });

  it('should escalate old P2 incidents', async () => {
    const base = {
      classification: { severity: 'P2_MEDIUM', affectedComponent: 'API', errorCategory: 'Timeout' },
      triageAnalysis: { headline: 'Test', rootCauseInferred: 'x', userImpactDescription: 'y' },
      remediationRunbook: { status: 'open', suggestedSteps: [], draftedNotification: '' },
      status: 'open',
      createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour old
    };
    await incidentStore.save('inc-esc', { ...base, incidentId: 'inc-esc' });

    const escalationService = (await import('../services/escalation-service.js')).default;
    await escalationService.tick();

    const incident = await incidentStore.fetch('inc-esc');
    // P2 with afterMin:15 and escalatedAt set only once
    expect(incident.escalatedAt).toBeDefined();
  });

  it('should not escalate recent incidents', async () => {
    const base = {
      classification: { severity: 'P1_HIGH', affectedComponent: 'API', errorCategory: 'Timeout' },
      triageAnalysis: { headline: 'Test', rootCauseInferred: 'x', userImpactDescription: 'y' },
      remediationRunbook: { status: 'open', suggestedSteps: [], draftedNotification: '' },
      status: 'open',
      createdAt: new Date().toISOString(), // brand new
    };
    await incidentStore.save('inc-new', { ...base, incidentId: 'inc-new' });

    const escalationService = (await import('../services/escalation-service.js')).default;
    await escalationService.tick();

    const incident = await incidentStore.fetch('inc-new');
    expect(incident.escalatedAt).toBeUndefined();
  });
});

// ── Incident Service ──
describe('incident-service', () => {
  beforeEach(async () => {
    const all = await incidentStore.query({});
    for (const i of all) await incidentStore.delete(i.incidentId);
  });

  it('should create, fetch, list, update, and delete', async () => {
    const { createIncident, getIncident, getAllIncidents, updateIncident, deleteIncident } = await import('../services/incident-service.js');
    const base = {
      classification: { severity: 'P0_CRITICAL', affectedComponent: 'API', errorCategory: 'Timeout' },
      triageAnalysis: { headline: 'Test', rootCauseInferred: 'x', userImpactDescription: 'y' },
      remediationRunbook: { status: 'open', suggestedSteps: [], draftedNotification: '' },
    };

    const created = await createIncident({ ...base, incidentId: 'crud-1' });
    expect(created.incidentId).toBe('crud-1');

    const fetched = await getIncident('crud-1');
    expect(fetched.classification.severity).toBe('P0_CRITICAL');

    const updated = await updateIncident('crud-1', { status: 'resolved' });
    expect(updated.status).toBe('resolved');

    const all = await getAllIncidents();
    expect(all.length).toBeGreaterThanOrEqual(1);

    await deleteIncident('crud-1');
    const afterDelete = await getIncident('crud-1');
    expect(afterDelete).toBeNull();
  });
});

// ── Copilot Context Service ──
describe('CopilotContext', () => {
  beforeEach(async () => {
    const all = await incidentStore.query({});
    for (const i of all) await incidentStore.delete(i.incidentId);
  });

  it('should throw for missing incident', async () => {
    const copilotContext = (await import('../services/copilot-context.js')).default;
    await expect(copilotContext.build('no-exist')).rejects.toThrow('Incident not found');
  });

  it('should build context for existing incident', async () => {
    const base = {
      classification: { severity: 'P1_HIGH', affectedComponent: 'Database', errorCategory: 'Timeout' },
      triageAnalysis: { headline: 'DB connection pool exhausted', rootCauseInferred: 'Too many connections', userImpactDescription: 'App slow' },
      remediationRunbook: { status: 'open', suggestedSteps: ['Kill idle connections'], draftedNotification: '' },
      status: 'open',
      timeline: [{ event: 'Alert Received', timestamp: new Date().toISOString() }],
    };
    await incidentStore.save('ctx-1', { ...base, incidentId: 'ctx-1', confidenceScore: 90 });

    const copilotContext = (await import('../services/copilot-context.js')).default;
    const ctx = await copilotContext.build('ctx-1');
    expect(ctx.incident.title).toBe('DB connection pool exhausted');
    expect(ctx.incident.severity).toBe('P1_HIGH');
    expect(ctx.history.seen).toBe(false);
  });

  it('should format context for LLM', async () => {
    const copilotContext = (await import('../services/copilot-context.js')).default;
    const ctx = {
      incident: {
        id: 'inc-1', title: 'Test', severity: 'P0', service: 'API', status: 'open',
        symptoms: ['high latency'], rootCause: { rootCause: 'OOM', evidence: ['memory spike'] },
        runbook: { summary: 'Restart', immediateActions: [{ step: 1, action: 'Restart API' }] },
        timeline: [{ event: 'Alert', timestamp: '2024-01-01T00:00:00Z' }],
        confidence: 85, createdAt: '2024-01-01T00:00:00Z',
      },
      history: { seen: false, count: 0 },
      now: '2024-01-01T00:00:00Z',
    };
    const formatted = copilotContext.formatForLLM(ctx);
    expect(formatted).toContain('Title: Test');
    expect(formatted).toContain('OOM');
    expect(formatted).toContain('No similar past incidents');
  });
});
