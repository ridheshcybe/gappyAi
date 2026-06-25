// backend/agents/triage-agent.js
import { lemmaClient } from '../lemma-config.js';
import fs from "fs";
import path from "path";

const promptPath = path.join(
  process.cwd(),
  "prompts",
  "triage-system-prompt.txt"
);

let systemPrompt = `You are an incident triage AI. Analyze alerts and return structured JSON with: severity, affectedComponent, errorCategory, headline, rootCauseInferred, userImpactDescription, confidenceScore`;

try {
  systemPrompt = fs.readFileSync(
    promptPath,
    "utf8"
  );
} catch (err) {
  console.warn("⚠️ Triage prompt file not found, using default");
}

class TriageAgent {
  async triage(rawAlert) {
    const response = await lemmaClient.agents.chat({
      agentId: 'incident_triage_agent',
      message: `Triage this alert: ${JSON.stringify(rawAlert)}`,
      systemPrompt: systemPrompt,
      model: "gpt-4.1",
      temperature: 0.1,
      maxTokens: 1200,
    });

    return response;
  }

  async run({ input, context = {} }) {
    // Convert the pipeline format to the triage method format
    const response = await this.triage(input);
    // Normalize response to have a .text property for pipeline compatibility
    return { text: response.content || response.text || JSON.stringify(response) };
  }
}

export default new TriageAgent();