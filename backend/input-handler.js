const { logStore } = require('./lemma-setup');
const { isValidIncident } = require('../schemas/validator');

async function ingestAlert(rawInput) {
  /**
   * rawInput = {
   *   source: 'email' | 'discord' | 'slack' | 'webhook',
   *   payload: string (the messy text)
   * }
   */

  try {
    // 1. Create a raw alert document in Lemma's document store
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const rawAlert = {
      id: alertId,
      source: rawInput.source,
      rawPayload: rawInput.payload,
      receivedAt: new Date().toISOString()
    };

    // Store raw alert in document store
    await logStore.save(alertId, JSON.stringify(rawAlert));
    console.log(`✓ Raw alert stored: \${alertId}`);

    return alertId;
  } catch (error) {
    console.error('Error ingesting alert:', error);
    throw error;
  }
}

module.exports = { ingestAlert };
