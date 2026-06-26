import { describe, it, expect, beforeEach } from 'vitest';
import incidentStore from '../stores/datastore.js';
import docStore from '../stores/document-store.js';

// Reset stores before tests
beforeEach(async () => {
  const all = await incidentStore.query({});
  for (const i of all) await incidentStore.delete(i.incidentId);
});

// ── Input Handler ──
describe('ingestAlert', () => {
  it('should ingest a valid alert and return an ID', async () => {
    const { ingestAlert } = await import('../input-handler.js');
    const alertId = await ingestAlert({ source: 'email', payload: 'CRITICAL: Server down' });
    expect(alertId).toMatch(/^alert_/);
    // Verify it was stored
    const stored = await docStore.fetch(alertId);
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored);
    expect(parsed.source).toBe('email');
    expect(parsed.payload).toBe('CRITICAL: Server down');
  });

  it('should reject invalid alerts', async () => {
    const { ingestAlert } = await import('../input-handler.js');
    await expect(ingestAlert({ source: 'unknown' })).rejects.toThrow();
  });

  it('should store metadata when provided', async () => {
    const { ingestAlert } = await import('../input-handler.js');
    const alertId = await ingestAlert({
      source: 'webhook',
      payload: 'test',
      metadata: { correlationId: 'abc-123', env: 'prod' },
    });
    const stored = JSON.parse(await docStore.fetch(alertId));
    expect(stored.metadata.correlationId).toBe('abc-123');
  });
});

// ── Alert Router ──
describe('alert-router', () => {
  it('should route P0 and return incident', async () => {
    const router = (await import('../alert-router.js')).default;
    const incident = {
      incidentId: 'inc-1',
      classification: { severity: 'P0_CRITICAL', affectedComponent: 'API', errorCategory: 'Timeout' },
      triageAnalysis: { headline: 'Critical outage', rootCauseInferred: 'x', userImpactDescription: 'y' },
    };
    const result = await router.routeIncident(incident);
    expect(result).toEqual(incident);
  });

  it('should route P1', async () => {
    const router = (await import('../alert-router.js')).default;
    const incident = {
      incidentId: 'inc-2',
      classification: { severity: 'P1_HIGH', affectedComponent: 'DB', errorCategory: 'Connection' },
      triageAnalysis: { headline: 'DB slow', rootCauseInferred: 'x', userImpactDescription: 'y' },
    };
    const result = await router.routeIncident(incident);
    expect(result.incidentId).toBe('inc-2');
  });

  it('should route P2', async () => {
    const router = (await import('../alert-router.js')).default;
    const incident = {
      incidentId: 'inc-3',
      classification: { severity: 'P2_MEDIUM', affectedComponent: 'UI', errorCategory: 'Warning' },
      triageAnalysis: { headline: 'UI warning', rootCauseInferred: 'x', userImpactDescription: 'y' },
    };
    const result = await router.routeIncident(incident);
    expect(result.incidentId).toBe('inc-3');
  });

  it('should route P3', async () => {
    const router = (await import('../alert-router.js')).default;
    const incident = {
      incidentId: 'inc-4',
      classification: { severity: 'P3_LOW', affectedComponent: 'Logs', errorCategory: 'Info' },
      triageAnalysis: { headline: 'Log notice', rootCauseInferred: 'x', userImpactDescription: 'y' },
    };
    const result = await router.routeIncident(incident);
    expect(result.incidentId).toBe('inc-4');
  });
});

// ── Agents (safeParse only, without AI calls) ──
describe('Agent safeParse methods', () => {
  it('RootCauseAgent parses valid JSON', async () => {
    const agent = (await import('../agents/root-cause-agent.js')).default;
    const result = agent.safeParse('{"rootCause": "DB overload", "confidence": 85}');
    expect(result.rootCause).toBe('DB overload');
    expect(result.confidence).toBe(85);
  });

  it('RootCauseAgent handles invalid JSON', async () => {
    const agent = (await import('../agents/root-cause-agent.js')).default;
    const result = agent.safeParse('not json');
    expect(result.rootCause).toBe('unknown');
  });

  it('RootCauseAgent extracts JSON from markdown', async () => {
    const agent = (await import('../agents/root-cause-agent.js')).default;
    const result = agent.safeParse('Here is the analysis:\n{"rootCause": "Network issue", "confidence": 90}\n---');
    expect(result.rootCause).toBe('Network issue');
  });

  it('NotificationAgent safeParse returns fallback on error', async () => {
    const agent = (await import('../agents/notification-agent.js')).default;
    const result = agent.safeParse('invalid', 'email');
    expect(result.channel).toBe('email');
    expect(result.title).toBe('Incident Notification');
  });

  it('NotificationAgent parses valid JSON', async () => {
    const agent = (await import('../agents/notification-agent.js')).default;
    const result = agent.safeParse('{"title": "Critical Alert", "body": "Details here", "priority": "critical"}', 'pagerduty');
    expect(result.title).toBe('Critical Alert');
    expect(result.priority).toBe('critical');
  });

  it('AssignmentAgent safeParse returns fallback', async () => {
    const agent = (await import('../agents/assignment-agent.js')).default;
    const result = agent.safeParse('bad data');
    expect(result.recommended).toBeNull();
  });

  it('RunbookAgent safeParse returns fallback', async () => {
    const agent = (await import('../agents/runbook-agent.js')).default;
    const result = agent.safeParse('bad data');
    expect(result.summary).toBe('runbook generation failed');
  });
});

// ── Lemma Config (without actual SDK) ──
describe('lemma-config', () => {
  it('should export lemmaClient', async () => {
    const config = await import('../lemma-config.js');
    expect(config.lemmaClient).toBeDefined();
  });
});
