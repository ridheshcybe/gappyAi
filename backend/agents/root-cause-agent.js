// backend/agents/root-cause-agent.js
import { lemmaClient } from '../lemma-config.js';

const PROMPT_TEMPLATE = `
You are a Site Reliability Engineer performing root cause analysis.

Given this incident:
- Headline: {headline}
- Severity: {severity}
- Affected Component: {component}
- Error Category: {errorCategory}

Analyze and return STRICT JSON:
{
  "rootCause": "single sentence identifying most probable cause",
  "evidence": ["supporting signal 1", "supporting signal 2"],
  "affectedComponents": ["component1", "component2"],
  "blastRadius": "what's impacted (users, services, regions)",
  "probableCauses": [
    {"cause": "...", "likelihood": "high|medium|low", "reason": "..."}
  ],
  "confidence": 0-100
}
`;

class RootCauseAgent {
  async analyze(triaged) {
    const prompt = PROMPT_TEMPLATE
      .replace('{headline}', triaged.headline || 'unknown')
      .replace('{severity}', triaged.severity || 'unknown')
      .replace('{component}', triaged.affectedComponent || 'unknown')
      .replace('{errorCategory}', triaged.errorCategory || 'unknown');

    const response = await lemmaClient.agents.chat({
      agentId: 'root_cause_analyzer_agent',
      message: prompt,
      system: 'You are an expert SRE. Always respond with valid JSON only.',
      model: 'gpt-4o-mini',
      temperature: 0.2,
    });

    return this.safeParse(response.content);
  }

  safeParse(text) {
    try {
      const match = text.match(/\{[\s\S]*\}/);
      return match ? JSON.parse(match[0]) : { rootCause: 'unknown', confidence: 0 };
    } catch {
      return { rootCause: 'analysis failed', confidence: 0 };
    }
  }
}

export default new RootCauseAgent();