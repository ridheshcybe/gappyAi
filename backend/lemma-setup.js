import { LemmaClient } from "lemma-sdk";

const client = new LemmaClient({
podId: '019ef9af-d95d-7610-9b82-fe5bf003ef7f'
});

await client.initialize();

// Initialize Datastore for storing structured incidents
const incidentStore = client.datastore('incidents', {
  schema: require('../schemas/incident-schema.json')
});

// Initialize Document Store for raw logs
const logStore = lemma.documentStore('raw_alerts');

// Initialize AI Agent
const triageAgent = lemma.agent('incident_triage', {
  model: 'gpt-4',
  systemPrompt: require('fs').readFileSync('./prompts/triage-system-prompt.txt', 'utf-8'),
  maxTokens: 1024
});

module.exports = { lemma, incidentStore, logStore, triageAgent };
