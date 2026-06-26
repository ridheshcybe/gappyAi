import { describe, it, expect, beforeEach } from 'vitest';
import incidentStore from '../stores/datastore.js';
import docStore from '../stores/document-store.js';

describe('document-store', () => {
  it('should save and fetch a document', async () => {
    const id = await docStore.save('test-1', { foo: 'bar' });
    expect(id).toBe('test-1');
    const fetched = await docStore.fetch('test-1');
    expect(fetched).toEqual({ foo: 'bar' });
  });

  it('should return null for missing documents', async () => {
    const result = await docStore.fetch('nonexistent');
    expect(result).toBeNull();
  });

  it('should overwrite existing documents on save', async () => {
    await docStore.save('dup', { v: 1 });
    await docStore.save('dup', { v: 2 });
    const fetched = await docStore.fetch('dup');
    expect(fetched).toEqual({ v: 2 });
  });
});

describe('datastore (incidentStore)', () => {
  const sampleIncident = {
    incidentId: 'inc-001',
    classification: { severity: 'P0_CRITICAL', affectedComponent: 'API', errorCategory: 'Timeout' },
    triageAnalysis: { headline: 'Test', rootCauseInferred: 'x', userImpactDescription: 'y' },
    remediationRunbook: { status: 'open', suggestedSteps: [], draftedNotification: '' },
    timestamp: new Date().toISOString(),
    status: 'open',
  };

  it('should save and fetch an incident', async () => {
    await incidentStore.save('inc-001', sampleIncident);
    const fetched = await incidentStore.fetch('inc-001');
    expect(fetched).toEqual(sampleIncident);
  });

  it('should return null for missing incidents', async () => {
    const result = await incidentStore.fetch('nonexistent');
    expect(result).toBeNull();
  });

  it('should query only incident-like objects', async () => {
    // Save an incident
    await incidentStore.save('inc-query-1', sampleIncident);
    // Save non-incident data (activity log, config)
    await incidentStore.put('activity:inc-query-1', { events: [] });
    await incidentStore.put('config:team', { engineers: [] });

    const results = await incidentStore.query({});
    const ids = results.map(r => r.incidentId);
    expect(ids).toContain('inc-query-1');
    expect(ids).not.toContain('activity:inc-query-1');
    expect(ids).not.toContain('config:team');
  });

  it('should update an existing incident', async () => {
    const updIncident = { ...sampleIncident, incidentId: 'inc-upd' };
    await incidentStore.save('inc-upd', updIncident);
    const updated = await incidentStore.update('inc-upd', { status: 'resolved' });
    expect(updated.status).toBe('resolved');
    expect(updated.incidentId).toBe('inc-upd');
    // Original fields preserved
    expect(updated.classification.severity).toBe('P0_CRITICAL');
  });

  it('should return null when updating non-existent', async () => {
    const result = await incidentStore.update('no-exist', { status: 'x' });
    expect(result).toBeNull();
  });

  it('should delete an incident', async () => {
    await incidentStore.save('inc-del', sampleIncident);
    const deleted = await incidentStore.delete('inc-del');
    expect(deleted).toBe(true);
    const fetched = await incidentStore.fetch('inc-del');
    expect(fetched).toBeNull();
  });

  it('should have get/put aliases', async () => {
    await incidentStore.put('test-key', { value: 42 });
    const result = await incidentStore.get('test-key');
    expect(result).toEqual({ value: 42 });
  });

  it('should query by status filter', async () => {
    await incidentStore.save('inc-open', { ...sampleIncident, incidentId: 'inc-open', status: 'open' });
    await incidentStore.save('inc-resolved', { ...sampleIncident, incidentId: 'inc-resolved', status: 'resolved' });
    
    const open = await incidentStore.query({ status: 'open' });
    expect(open.every(i => i.status === 'open')).toBe(true);
  });
});
