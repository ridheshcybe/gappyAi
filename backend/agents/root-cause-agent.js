import lemma from "../lemma-config.js";

const PROMPT_TEMPLATE = `
You are a Site Reliability Engineer performing root cause analysis.

Given this incident:
- Title: {title}
- Severity: {severity}
- Service: {service}
- Symptoms: {symptoms}
- Alerts: {alerts}

Analyze and return STRICT JSON:
{
  "rootCause": "single sentence identifying most probable cause",
  "evidence": ["supporting signal 1", "supporting signal 2", "..."],
  "affectedComponents": ["component1", "component2"],
  "blastRadius": "what's impacted (users, services, regions)",
  "probableCauses": [
    {"cause": "...", "likelihood": "high|medium|low", "reason": "..."}
  ],
  "confidence": 0-100
}
`;

class RootCauseAgent {
  constructor() {
    this.agent = lemma.agent({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      system: 'You are an expert SRE. Always respond with valid JSON only.'
    });
  }

  async analyze(incident) {
    const prompt = PROMPT_TEMPLATE
      .replace('{title}', incident.title)
      .replace('{severity}', incident.severity)
      .replace('{service}', incident.service || 'unknown')
      .replace('{symptoms}', JSON.stringify(incident.symptoms || []))
      .replace('{alerts}', JSON.stringify(incident.alerts || []));

    const response = await this.agent.complete(prompt);
    return this.safeParse(response);
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