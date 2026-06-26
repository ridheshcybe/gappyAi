import { describe, it, expect } from 'vitest';
import { validateRawAlert } from '../utils/validate-raw-alert.js';
import { isValidIncident } from '../schemas/validator.js';

describe('validateRawAlert', () => {
  it('should accept a valid alert', () => {
    const result = validateRawAlert({
      id: 'alert_123',
      source: 'email',
      payload: 'CRITICAL: Server down',
      receivedAt: new Date().toISOString(),
    });
    expect(result.isValid).toBe(true);
    expect(result.errors).toBeNull();
  });

  it('should reject missing id', () => {
    const result = validateRawAlert({
      source: 'email',
      payload: 'test',
      receivedAt: new Date().toISOString(),
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).not.toBeNull();
  });

  it('should reject invalid source enum', () => {
    const result = validateRawAlert({
      id: 'alert_1',
      source: 'pagerduty',
      payload: 'test',
      receivedAt: new Date().toISOString(),
    });
    expect(result.isValid).toBe(false);
  });

  it('should reject missing required fields', () => {
    const result = validateRawAlert({ id: 'alert_1' });
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });

  it('should reject invalid date-time format', () => {
    const result = validateRawAlert({
      id: 'alert_1',
      source: 'email',
      payload: 'test',
      receivedAt: 'not-a-date',
    });
    expect(result.isValid).toBe(false);
  });

  it('should accept valid metadata', () => {
    const result = validateRawAlert({
      id: 'alert_1',
      source: 'webhook',
      payload: 'test',
      receivedAt: new Date().toISOString(),
      metadata: { correlationId: 'abc-123', environment: 'prod' },
    });
    expect(result.isValid).toBe(true);
  });
});

describe('isValidIncident', () => {
  const validIncident = {
    incidentId: 'inc-001',
    timestamp: new Date().toISOString(),
    classification: {
      severity: 'P0_CRITICAL',
      affectedComponent: 'API Gateway',
      errorCategory: 'Timeout',
    },
    triageAnalysis: {
      headline: 'API Gateway down',
      rootCauseInferred: 'Connection pool exhausted',
      userImpactDescription: 'Users cannot login',
    },
    remediationRunbook: {
      status: 'open',
      suggestedSteps: ['Restart gateway'],
      draftedNotification: 'Incident detected',
    },
  };

  it('should accept a valid incident', () => {
    expect(isValidIncident(validIncident)).toBe(true);
  });

  it('should reject missing incidentId', () => {
    const { incidentId, ...rest } = validIncident;
    expect(isValidIncident(rest)).toBe(false);
  });

  it('should reject missing classification', () => {
    const { classification, ...rest } = validIncident;
    expect(isValidIncident(rest)).toBe(false);
  });

  it('should reject invalid severity enum', () => {
    const invalid = {
      ...validIncident,
      classification: { ...validIncident.classification, severity: 'P5' },
    };
    expect(isValidIncident(invalid)).toBe(false);
  });

  it('should reject missing triageAnalysis', () => {
    const { triageAnalysis, ...rest } = validIncident;
    expect(isValidIncident(rest)).toBe(false);
  });

  it('should accept with valid timeline entries', () => {
    const withTimeline = {
      ...validIncident,
      timeline: [
        { event: 'Alert Received', timestamp: new Date().toISOString() },
        { event: 'Triaged', timestamp: new Date().toISOString() },
      ],
      confidenceScore: 85,
    };
    expect(isValidIncident(withTimeline)).toBe(true);
  });

  it('should reject out-of-range confidence score', () => {
    const invalid = { ...validIncident, confidenceScore: 150 };
    expect(isValidIncident(invalid)).toBe(false);
  });
});
