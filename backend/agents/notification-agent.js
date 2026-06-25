import lemma from '../lemma-config.js';

const PROMPT_TEMPLATE = `
Format an incident notification for {channel}.

Incident:
- Title: {title}
- Severity: {severity}
- Root Cause: {rootCause}
- Service: {service}
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
  constructor() {
    this.agent = lemma.agent({
      model: 'gpt-4o-mini',
      temperature: 0.4,
      system: 'You format incident notifications. Always valid JSON.'
    });
  }

  async format(incident, rootCause, runbook, channel = 'slack') {
    const prompt = PROMPT_TEMPLATE
      .replaceAll('{channel}', channel)
      .replace('{title}', incident.title)
      .replace('{severity}', incident.severity)
      .replace('{rootCause}', rootCause?.rootCause || 'unknown')
      .replace('{service}', incident.service || 'unknown')
      .replace('{runbookSummary}', runbook?.summary || 'N/A');

    const response = await this.agent.complete(prompt);
    return this.safeParse(response, channel);
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