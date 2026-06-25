import lemma from "../lemma-config.js";
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

const triageAgent = lemma.agent(
  "incident_triage_agent",
  {
    model: "gpt-4.1",
    systemPrompt,
    temperature: 0.1,
    maxTokens: 1200,
  }
);

export default triageAgent;