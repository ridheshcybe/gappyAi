// backend/lemma-setup.js
import { LemmaClient } from "lemma-sdk";

// Initialize the Lemma Client pointing to your pod
export const lemmaClient = new LemmaClient({
  apiUrl: process.env.LEMMA_API_URL,
  authUrl: process.env.LEMMA_AUTH_URL,
  podId: process.env.LEMMA_POD_ID || '019ef9af-d95d-7610-9b82-fe5bf003ef7f'
});

// Export an async initializer to call when your server starts
export async function initLemma() {
  try {
    await lemmaClient.initialize();
    console.log(`✅ Lemma Client initialized for Pod: ${process.env.LEMMA_POD_ID}`);
  } catch (err) {
    console.error("❌ Lemma Client failed to initialize:", err.message);
  }
}

// Note: The following lines are commented out because the real Lemma SDK may have different methods.
// Please refer to the Lemma SDK documentation for the correct way to set up datastores, document stores, and agents.
//
// const incidentStore = lemmaClient.datastore('incidents', {
//   schema: require('../schemas/incident-schema.json')
// });
//
// const logStore = lemmaClient.documents('raw_alerts');
//
// const triageAgent = lemmaClient.agents.create('incident_triage', {
//   model: 'gpt-4',
//   systemPrompt: require('fs').readFileSync('./prompts/triage-system-prompt.txt', 'utf-8'),
//   maxTokens: 1024
// });

// For backward compatibility, we export the client as 'lemma' and set the other exports to null.
export const lemma = lemmaClient;
export const incidentStore = null;
export const logStore = null;
export const triageAgent = null;

export default lemmaClient;