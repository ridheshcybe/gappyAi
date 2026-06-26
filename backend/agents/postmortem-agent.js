// backend/agents/postmortem-agent.js
import { chatCompletion } from '../lib/openrouter.js';
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
  async generate(incidentId) {
    const ctx = await copilotContext.build(incidentId);
    const contextBlock = copilotContext.formatForLLM(ctx);
    const prompt = PROMPT.replace('{context}', contextBlock);

    const response = await chatCompletion({
      model: 'openai/gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
    });

    return {
      incidentId,
      markdown: response.content || '',
      generatedAt: new Date().toISOString(),
      source: 'ai-generated'
    };
  }
}

export default new PostMortemAgent();