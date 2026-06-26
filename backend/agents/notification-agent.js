// backend/agents/notification-agent.js
import { chatCompletion } from '../lib/openrouter.js';

const PROMPT_TEMPLATE = `
Format an incident notification for {channel}.

Incident:
- Headline: {headline}
- Severity: {severity}
- Root Cause: {rootCause}
- Affected Component: {component}
- Runbook Summary: {runbookSummary}

Adapt tone/length for channel:
- pagerduty: technical, includes triage hints
- email: detailed, includes context and next steps

Return STRICT JSON:
{
  "channel": "{channel}",
  "title": "...",
  "body": "...",
  "mentions": ["@oncall-db", "@oncall-api"],
  "priority": "critical|high|medium|low",
  "metadata": {"service": "...", "severity": "..."}
}
`;

class NotificationAgent {
  async format(incident, rootCause, runbook, channel = 'slack') {
    const prompt = PROMPT_TEMPLATE
      .replaceAll('{channel}', channel)
      .replace('{headline}', incident.triageAnalysis?.headline || 'unknown')
      .replace('{severity}', incident.classification?.severity || 'unknown')
      .replace('{rootCause}', rootCause?.rootCause || 'unknown')
      .replace('{component}', incident.classification?.affectedComponent || 'unknown')
      .replace('{runbookSummary}', runbook?.summary || 'N/A');

    const response = await chatCompletion({
      model: 'openai/gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You format incident notifications. Always valid JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
    });

    return this.safeParse(response.content, channel);
  }

  safeParse(text, channel) {
    try {
      const match = text.match(/\{[\s\S]*\}/);
      return match ? JSON.parse(match[0]) : this.fallback(channel);
    } catch {
      return this.fallback(channel);
    }
  }

  fallback(channel) {
    return { channel, title: 'Incident Notification', body: 'See dashboard', priority: 'high' };
  }
}

export default new NotificationAgent();