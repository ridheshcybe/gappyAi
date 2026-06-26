import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import incidentStore from '../stores/datastore.js';

// Import the Express app (doesn't start listening)
let app;

beforeAll(async () => {
  // Clear stores before tests
  const all = await incidentStore.query({});
  for (const i of all) await incidentStore.delete(i.incidentId);
  app = (await import('../index.js')).default;
});

afterAll(async () => {
  // Clear stores
  const all = await incidentStore.query({});
  for (const i of all) await incidentStore.delete(i.incidentId);
});

describe('GET /api/health', () => {
  it('should return healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.service).toBe('SecureOps Sync');
  });
});

describe('POST /api/ingest', () => {
  it('should ingest a valid alert', async () => {
    const res = await request(app)
      .post('/api/ingest')
      .send({ source: 'email', payload: 'CRITICAL: Server down' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.alertId).toMatch(/^alert_/);
  });

  it('should reject invalid alert', async () => {
    const res = await request(app)
      .post('/api/ingest')
      .send({ source: 'invalid-source' });
    expect(res.status).toBe(500);
  });
});

describe('GET /api/incidents', () => {
  it('should return empty list initially', async () => {
    const res = await request(app).get('/api/incidents');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.incidents)).toBe(true);
  });

  it('should return seeded incidents', async () => {
    const base = {
      classification: { severity: 'P0_CRITICAL', affectedComponent: 'API', errorCategory: 'Timeout' },
      triageAnalysis: { headline: 'Test incident', rootCauseInferred: 'x', userImpactDescription: 'y' },
      remediationRunbook: { status: 'open', suggestedSteps: [], draftedNotification: '' },
      timestamp: new Date().toISOString(),
    };
    await incidentStore.save('api-test-1', { ...base, incidentId: 'api-test-1' });

    const res = await request(app).get('/api/incidents');
    expect(res.status).toBe(200);
    expect(res.body.incidents.some(i => i.incidentId === 'api-test-1')).toBe(true);
  });
});

describe('POST /api/activity', () => {
  it('should create activity', async () => {
    const res = await request(app)
      .post('/api/activity')
      .send({ incidentId: 'act-test', type: 'created', actor: 'system', payload: { test: true } });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
  });
});

describe('GET /api/topology', () => {
  it('should return topology data', async () => {
    const res = await request(app).get('/api/topology');
    expect(res.status).toBe(200);
    expect(res.body.topology).toBeDefined();
    expect(res.body.topology.nodes).toHaveLength(7);
  });
});
