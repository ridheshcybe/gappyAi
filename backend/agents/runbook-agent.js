// backend/agents/runbook-agent.js
import { chatCompletion } from '../lib/openrouter.js';
import RootCauseAgent from './root-cause-agent.js';

const PROMPT_TEMPLATE = `
Generate an operational runbook for this incident.

Incident:
- Headline: {headline}
- Severity: {severity}
- Root Cause: {rootCause}
- Affected Components: {affectedComponents}

Return STRICT JSON:
{
  "summary": "1-2 sentence executive summary",
  "immediateActions": [
    {"step": 1, "action": "...", "command": "bash command if any", "verification": "how to verify"}
  ],
  "investigationSteps": [
    {"step": 1, "action": "...", "command": "...", "expectedOutput": "..."}
  ],
  "mitigationSteps": [
    {"step": 1, "action": "...", "command": "...", "rollback": "..."}
  ],
  "preventionSteps": ["actionable prevention item"],
  "estimatedTimeToResolve": "X minutes",
  "requiredAccess": ["required role/permission"],
  "safetyChecks": ["what to verify before declaring resolved"]
}
`;

class RunbookAgent {
  async generate(triaged, rootCause) {
    const prompt = PROMPT_TEMPLATE
      .replace('{headline}', triaged.headline || 'unknown')
      .replace('{severity}', triaged.severity || 'unknown')
      .replace('{rootCause}', rootCause?.rootCause || 'unknown')
      .replace('{affectedComponents}', (rootCause?.affectedComponents || []).join(', '));

    const response = await chatCompletion({
      model: 'openai/gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an SRE runbook generator. Always valid JSON. Commands must be safe and copy-pasteable.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
    });

    return this.safeParse(response.content);
  }

  safeParse(text) {
    try {
      const match = text.match(/\{[\s\S]*\}/);
      return match ? JSON.parse(match[0]) : { summary: 'runbook generation failed' };
    } catch {
      return { summary: 'runbook generation failed' };
    }
  }
}

export default new RunbookAgent();