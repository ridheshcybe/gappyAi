import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

async function importApi() {
  return await import('../api.js');
}

describe('ingestAlert', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ success: true, alertId: 'alert_123' }) });
  });

  it('should POST to /api/ingest with JSON body', async () => {
    const { ingestAlert } = await importApi();
    await ingestAlert({ source: 'email', payload: 'test' });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/ingest'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('email'),
      })
    );
  });

  it('should return the parsed JSON response', async () => {
    const { ingestAlert } = await importApi();
    const result = await ingestAlert({ source: 'email', payload: 'test' });
    expect(result.success).toBe(true);
    expect(result.alertId).toBe('alert_123');
  });
});

describe('getIncidents', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({ json: () => Promise.resolve({ success: true, incidents: [{ id: '1' }, { id: '2' }] }) });
  });

  it('should GET /api/incidents', async () => {
    const { getIncidents } = await importApi();
    await getIncidents();
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/incidents'));
  });

  it('should return the incidents array', async () => {
    const { getIncidents } = await importApi();
    const result = await getIncidents();
    expect(result.incidents).toHaveLength(2);
  });
});

describe('triageAlert', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ success: true }) });
  });

  it('should POST to /api/triage/:id', async () => {
    const { triageAlert } = await importApi();
    await triageAlert('alert-xyz');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/triage/alert-xyz'),
      expect.objectContaining({ method: 'POST' })
    );
  });
});

describe('copilotChat', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({ json: () => Promise.resolve({ reply: 'Analysis complete' }) });
  });

  it('should POST to /api/copilot/chat with conversation', async () => {
    const { copilotChat } = await importApi();
    await copilotChat('inc-1', 'What happened?', [{ role: 'user', content: 'Hi' }]);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/copilot/chat'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('inc-1'),
      })
    );
  });

  it('should default conversation to empty array', async () => {
    const { copilotChat } = await importApi();
    await copilotChat('inc-1', 'What happened?');
    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.conversation).toEqual([]);
  });
});

describe('getCopilotConversation', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({ json: () => Promise.resolve({ messages: [{ role: 'assistant', content: 'Hello' }] }) });
  });

  it('should GET /api/copilot/conversation/:id', async () => {
    const { getCopilotConversation } = await importApi();
    await getCopilotConversation('inc-1');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/copilot/conversation/inc-1')
    );
  });
});

describe('activity APIs', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({ json: () => Promise.resolve({ events: [] }) });
  });

  it('getActivityFeed should accept limit param', async () => {
    const { getActivityFeed } = await importApi();
    await getActivityFeed(10);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('limit=10')
    );
  });

  it('getActivityFeed should default limit to 50', async () => {
    const { getActivityFeed } = await importApi();
    await getActivityFeed();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('limit=50')
    );
  });

  it('getIncidentActivity should GET with incidentId', async () => {
    const { getIncidentActivity } = await importApi();
    await getIncidentActivity('inc-1');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/activity/inc-1')
    );
  });

  it('postActivity should POST with data', async () => {
    const { postActivity } = await importApi();
    await postActivity({ incidentId: 'inc-1', type: 'comment' });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/activity'),
      expect.objectContaining({ method: 'POST' })
    );
  });
});

describe('assignment APIs', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({ json: () => Promise.resolve({ recommended: 'Sarah' }) });
  });

  it('recommendAssignee should GET with incidentId', async () => {
    const { recommendAssignee } = await importApi();
    await recommendAssignee('inc-1');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/incidents/inc-1/assignee')
    );
  });

  it('assignIncident should POST with assignee and reason', async () => {
    const { assignIncident } = await importApi();
    mockFetch.mockResolvedValue({ json: () => Promise.resolve({ incidentId: 'inc-1', assignee: 'Sarah' }) });
    await assignIncident('inc-1', 'Sarah', 'Most experienced');
    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.assignee).toBe('Sarah');
    expect(callBody.reason).toBe('Most experienced');
  });
});

describe('post-mortem APIs', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({ json: () => Promise.resolve({ markdown: '# Postmortem\n' }) });
  });

  it('generatePostMortem should POST', async () => {
    const { generatePostMortem } = await importApi();
    await generatePostMortem('inc-1');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/incidents/inc-1/postmortem'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('getPostMortem should GET', async () => {
    const { getPostMortem } = await importApi();
    await getPostMortem('inc-1');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/incidents/inc-1/postmortem')
    );
  });
});

describe('getExecutiveMetrics', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({ json: () => Promise.resolve({ openIncidents: 5 }) });
  });

  it('should GET executive metrics', async () => {
    const { getExecutiveMetrics } = await importApi();
    const result = await getExecutiveMetrics();
    expect(result.openIncidents).toBe(5);
  });
});

describe('getTopology', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({ json: () => Promise.resolve({ topology: { nodes: [] } }) });
  });

  it('should GET topology', async () => {
    const { getTopology } = await importApi();
    const result = await getTopology();
    expect(result.topology).toBeDefined();
  });
});
