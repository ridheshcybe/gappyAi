// backend/api/webhooks.js
import { processAlert } from '../triage-pipeline.js';
import { randomUUID } from 'crypto';

// Standard Prometheus Alertmanager payload mapping
export async function prometheusWebhook(req, res) {
  try {
    const payload = req.body;

    // Alertmanager sends an array of alerts
    const alerts = payload.alerts || [payload];

    for (const alert of alerts) {
      // Map Prometheus structure to our internal raw-alert schema
      const rawAlert = {
        correlationId: alert.fingerprint || randomUUID(),
        source: 'prometheus',
        title: alert.labels.alertname || 'Unknown Prometheus Alert',
        service: alert.labels.service || alert.labels.job || 'unknown',
        severity: mapPromSeverity(alert.labels.severity),
        symptoms: [
          alert.annotations.summary,
          alert.annotations.description
        ].filter(Boolean),
        alerts: [{
          labels: alert.labels,
          annotations: alert.annotations,
          startsAt: alert.startsAt
        }],
        rawPayload: alert
      };

      // Fire and forget into pipeline
      processAlert(rawAlert).catch(err =>
        console.error(`Pipeline failed for alert ${rawAlert.correlationId}:`, err)
      );
    }

    res.status(202).json({ status: 'accepted', count: alerts.length });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
}

function mapPromSeverity(sev) {
  switch ((sev || '').toLowerCase()) {
    case 'critical': return 'P0';
    case 'warning': return 'P1';
    case 'info': return 'P3';
    default: return 'P2';
  }
}