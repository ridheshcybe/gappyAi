// backend/agents/assignment-agent.js
import { chatCompletion } from '../lib/openrouter.js';
import incidentStore from '../stores/datastore.js';

const PROMPT = `
You are an incident routing AI. Recommend the best on-call engineer.

Incident:
- Headline: {headline}
- Affected Component: {component}
- Severity: {severity}
- Root Cause: {rootCause}

Available engineers (with expertise and resolution history):
{engineers}

Historical context: {history}

Return STRICT JSON:
{
  "recommended": "engineer name",
  "confidence": 0-100,
  "reason": "1 sentence why",
  "alternatives": [{"name": "...", "reason": "..."}]
}
`;

class AssignmentAgent {
  async recommend(incident, history = {}) {
    const engineers = await this.getEngineers();
    const prompt = PROMPT
      .replace('{headline}', incident.triageAnalysis?.headline || 'unknown')
      .replace('{component}', incident.classification?.affectedComponent || 'unknown')
      .replace('{severity}', incident.classification?.severity || 'unknown')
      .replace('{rootCause}', incident.rootCause?.rootCause || 'unknown')
      .replace('{engineers}', JSON.stringify(engineers, null, 2))
      .replace('{history}', JSON.stringify(history));

    const response = await chatCompletion({
      model: 'openai/gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an on-call routing AI. Always valid JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
    });

    return this.safeParse(response.content);
  }

  async getEngineers() {
    const config = await incidentStore.fetch('config:team');
    if (config?.engineers) return config.engineers;

    // Fallback defaults
    return [
      { name: 'Sarah Chen', role: 'DBA', expertise: ['database', 'postgres', 'mysql'], resolvedCount: 17 },
      { name: 'Marcus Webb', role: 'API Engineer', expertise: ['api', 'gateway', 'auth'], resolvedCount: 23 },
      { name: 'Priya Nair', role: 'Infra', expertise: ['kubernetes', 'networking', 'cdn'], resolvedCount: 14 },
      { name: 'Diego Santos', role: 'Backend', expertise: ['queue', 'cache', 'redis'], resolvedCount: 11 }
    ];
  }

  safeParse(text) {
    try {
      const match = text.match(/\{[\s\S]*\}/);
      return match ? JSON.parse(match[0]) : { recommended: null, confidence: 0 };
    } catch {
      return { recommended: null, confidence: 0 };
    }
  }
}

export default new AssignmentAgent();