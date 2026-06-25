import lemma from '../lemma-config.js';
import RootCauseAgent from './root-cause-agent.js';

const PROMPT_TEMPLATE = `
Generate an operational runbook for this incident.

Incident:
- Title: {title}
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
  constructor() {
    this.agent = lemma.agent({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      system: 'You are an SRE runbook generator. Always valid JSON. Commands must be safe and copy-pasteable.'
    });
  }

  async generate(incident, rootCause) {
    const prompt = PROMPT_TEMPLATE
      .replace('{title}', incident.title)
      .replace('{severity}', incident.severity)
      .replace('{rootCause}', rootCause.rootCause)
      .replace('{affectedComponents}', (rootCause.affectedComponents || []).join(', '));

    const response = await this.agent.complete(prompt);
    return this.safeParse(response);
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