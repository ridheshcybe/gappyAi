const { Lemma } = require('@lemma-ai/sdk');
require('dotenv').config();

// Initialize Lemma environment
const lemma = new Lemma({
  apiKey: process.env.LEMMA_API_KEY,
  environment: 'local' // Use local for dev, 'cloud' for production
});

// Initialize Datastore for storing structured incidents
const incidentStore = lemma.datastore('incidents', {
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
