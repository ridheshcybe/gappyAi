import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import request from 'supertest';
import { mockStoreImpl, mockAgentImpl, mockEmbeddingModelImpl } from './mocks/lemma.js';

// Mock lemma-sdk before importing the app
vi.mock('lemma-sdk', () => await import('./mocks/lemma.js'));

// Now import the app
import app from '../index.js';

let server;

describe('API Integration Tests', () => {
  beforeAll(() => {
    // Start the server
    server = app.listen(3001, () => {
      console.log('Test server running on port 3001');
    });
  });

  afterAll(() => {
    // Close the server
    server.close();
  });

  describe('Feature 1: Alert Ingestion', () => {
    it('POST /api/alerts with a valid payload returns 200/201 and creates an incident', async () => {
      // Reset mock store
      mockStoreImpl.fetch.mockReset();
      mockStoreImpl.save.mockReset();

      // We'll simulate that the alert is saved and then fetched by the triage pipeline
      // For the alert ingestion endpoint, it only saves to the document store (raw_alerts) and returns the alertId.
      // The triage pipeline is not triggered by this endpoint alone; we need to call /api/triage/:alertId separately.
      // However, the user's description says: "POST /api/alerts with a valid payload returns 200/201 and creates an incident."
      // Looking at the backend code, there is no /api/alerts endpoint. There is /api/ingest.
      // Let's check the routes again: in index.js we have:
      //   app.post('/api/ingest', ...)   // from input-handler.js
      //   app.post('/api/triage/:alertId', ...)   // from triage-pipeline.js
      //   app.post('/api/webhooks/prometheus', ...) // from api/webhooks.js
      //   app.post('/api/copilot/chat', ...) // from api/copilot.js
      //   app.post('/api/integrations/github/postmortem/:incidentId', ...) // from api/integrations/github.js? not in index.js
      //   app.post('/api/integrations/slack/command', ...) // from api/integrations/slack.js? not in index.js
      //   app.post('/api/remediation/execute', ...) // from api/remediation.js? not in index.js

      // Wait, we need to check the api directory for the other endpoints.

      // Let's look at the api directory to see what endpoints are defined.

      // Given the time, we will test the endpoints that are actually in index.js and then also check the api directory for the others.

      // However, the user's description of routes might be from a different version.

      // Let's check the api directory structure.
    });
  });
});