// backend/agents/notification-agent.js
import { lemmaClient } from '../lemma-config.js';

const PROMPT_TEMPLATE = `
Format an incident notification for {channel}.

Incident:
- Headline: {headline}
- Severity: {severity}
- Root Cause: {rootCause}
- Affected Component: {component}
- Runbook Summary: {runbookSummary}

Adapt tone/length for channel:
- slack: concise, emoji severity prefix, action-oriented
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

    // Use lemmaClient for the completion
    const response = await lemmaClient.agents.chat({
      agentId: 'notification_formatter_agent',
      message: prompt,
      system: 'You format incident notifications. Always valid JSON.',
      model: 'gpt-4o-mini',
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