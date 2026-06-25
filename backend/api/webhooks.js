// backend/api/webhooks.js
import { v4 as uuidv4 } from 'uuid';
import { ingestAlert } from '../input-handler.js';
import { triageIncident } from '../triage-pipeline.js';

// Standard Prometheus Alertmanager payload mapping
export async function prometheusWebhook(req, res) {
  try {
    const payload = req.body;

    // Alertmanager sends an array of alerts
    const alerts = payload.alerts || [payload];

    for (const alert of alerts) {
      const correlationId = alert.fingerprint || uuidv4();

      // Map Prometheus structure to our internal raw-alert schema
      const rawAlert = {
        source: 'prometheus',
        title: alert.labels?.alertname || 'Unknown Prometheus Alert',
        service: alert.labels?.service || alert.labels?.job || 'unknown',
        severity: mapPromSeverity(alert.labels?.severity),
        alertname: alert.labels?.alertname,
        symptoms: [
          alert.annotations?.summary,
          alert.annotations?.description
        ].filter(Boolean),
        correlationId
      };

      // First ingest the alert, then triage it via the returned alertId
      ingestAlert({ source: 'prometheus', payload: JSON.stringify(rawAlert) })
        .then(alertId => triageIncident(alertId))
        .catch(err => console.error(`Pipeline failed for alert ${correlationId}:`, err));
    }

    res.status(202).json({ status: 'accepted', count: alerts.length });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
}

function mapPromSeverity(sev) {
  switch ((sev || '').toLowerCase()) {
    case 'critical': return 'P0_CRITICAL';
    case 'warning': return 'P1_HIGH';
    case 'info': return 'P3_LOW';
    default: return 'P2_MEDIUM';
  }
}
