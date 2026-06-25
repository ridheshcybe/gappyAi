// backend/agents/triage-agent.js
import { lemmaClient } from '../lemma-config.js';
import fs from "fs";
import path from "path";

const promptPath = path.join(
  process.cwd(),
  "prompts",
  "triage-system-prompt.txt"
);

const systemPrompt = fs.readFileSync(
  promptPath,
  "utf8"
);

class TriageAgent {
  async triage(rawAlert) {
    // Use the actual lemmaClient namespace for agents/conversations
    // Based on Lemma SDK docs, this would typically be:
    const response = await lemmaClient.agents.chat({
      agentId: 'incident_triage_agent', // matches the agent name in pod
      message: `Triage this alert: ${JSON.stringify(rawAlert)}`,
      systemPrompt: systemPrompt,
      model: "gpt-4.1",
      temperature: 0.1,
      maxTokens: 1200,
    });

    return response;
  }
}

export default new TriageAgent();