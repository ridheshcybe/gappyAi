// backend/agents/postmortem-agent.js
import Lemma from '../lemma-config.js';
import copilotContext from '../services/copilot-context.js';

const SYSTEM = `You generate professional incident post-mortems (RCAs).
Format as structured markdown. Be factual, blameless, actionable.
Reference timestamps from timeline. Include measurable impact.
Never invent data — if unknown, write "TBD".`;

const PROMPT = `Generate a post-mortem for the following incident.

{context}

Return markdown with these sections exactly:
## Summary
## Impact
## Timeline
## Root Cause
## Resolution
## What Went Well
## What Went Wrong
## Action Items
## Prevention
`;

class PostMortemAgent {
  constructor() {
    this.agent = Lemma.agent({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      system: SYSTEM
    });
  }

  async generate(incidentId) {
    const ctx = await copilotContext.build(incidentId);
    const contextBlock = copilotContext.formatForLLM(ctx);
    const prompt = PROMPT.replace('{context}', contextBlock);

    const response = await this.agent.complete(prompt);
    return {
      incidentId,
      markdown: response.content,
      generatedAt: new Date().toISOString(),
      source: 'ai-generated'
    };
  }
}

export default new PostMortemAgent();