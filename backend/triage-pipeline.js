const { triageAgent, incidentStore, logStore } = require('./lemma-setup');
const { isValidIncident } = require('../schemas/validator');
const { generateRunbook } = require('./runbook-generator');
const { routeIncident } = require('./alert-router');

async function triageIncident(alertId) {
  try {
    // 1. Fetch raw alert
    const rawAlert = await logStore.fetch(alertId);
    const alertData = JSON.parse(rawAlert);
    console.log(`📥 Processing alert: ${alertId}`);

    // 2. Send to triage agent
    const triageResult = await triageAgent.run({
      input: alertData.rawPayload,
      context: {
        source: alertData.source,
        receivedAt: alertData.receivedAt
      }
    });

    // 3. Parse and validate output
    let structuredIncident;
    try {
      structuredIncident = JSON.parse(triageResult.text);
    } catch (parseError) {
      console.error('Agent did not return valid JSON:', triageResult.text);
      throw new Error('Invalid JSON from triage agent');
    }

    if (!isValidIncident(structuredIncident)) {
      throw new Error('Incident structure does not match schema');
    }

    // 4. Enhance with runbook generation
    structuredIncident = generateRunbook(structuredIncident);

    // 5. Route based on severity
    structuredIncident = await routeIncident(structuredIncident);

    // 6. Store in datastore
    await incidentStore.save(structuredIncident.incidentId, structuredIncident);
    console.log(`✓ Incident fully processed: ${structuredIncident.incidentId}`);

    return structuredIncident;
  } catch (error) {
    console.error('Error triaging incident:', error);
    throw error;
  }
}

module.exports = { triageIncident };
