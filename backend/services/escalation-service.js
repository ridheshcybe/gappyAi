// backend/services/escalation-service.js
import incidentStore from '../stores/datastore.js';
import activityService from './activity-service.js';

const SHORT_TO_FULL = { 'P0': 'P0_CRITICAL', 'P1': 'P1_HIGH', 'P2': 'P2_MEDIUM', 'P3': 'P3_LOW' };
const FULL_TO_SHORT = { 'P0_CRITICAL': 'P0', 'P1_HIGH': 'P1', 'P2_MEDIUM': 'P2', 'P3_LOW': 'P3' };

const RULES = {
  P2: { afterMin: 15, escalateTo: 'P1' },
  P1: { afterMin: 30, escalateTo: 'P0' },
  P0: { afterMin: 0, escalateTo: null } // already max
};

class EscalationService {
  constructor() {
    this.interval = null;
  }

  start() {
    if (this.interval) return;
    this.interval = setInterval(() => this.tick(), 60_000); // every minute
    console.log('⏰ Escalation scheduler started');
  }

  stop() {
    clearInterval(this.interval);
    this.interval = null;
  }

  async tick() {
    try {
      const all = await incidentStore.query({}) || [];
      const incidents = Array.isArray(all) ? all.filter(i => i.status === 'open') : [];
      const now = Date.now();

      for (const inc of incidents) {
        const severity = inc.classification?.severity || inc.severity;
        const shortSeverity = FULL_TO_SHORT[severity] || severity;
        const rule = RULES[shortSeverity];
        if (!rule || !rule.escalateTo) continue;

        const ageMin = (now - new Date(inc.createdAt).getTime()) / 60_000;
        if (ageMin >= rule.afterMin && !inc.escalatedAt) {
          await this.escalate(inc, rule.escalateTo);
        }
      }
    } catch (err) {
      console.error('Escalation tick failed:', err);
    }
  }

  async escalate(incident, newShortSeverity) {
    const incidentId = incident.incidentId || incident.id;
    const old = incident.classification?.severity || incident.severity;
    const newFullSeverity = SHORT_TO_FULL[newShortSeverity] || newShortSeverity;

    incident.classification = incident.classification || {};
    incident.classification.severity = newFullSeverity;
    incident.severity = newFullSeverity;
    incident.escalatedAt = new Date().toISOString();
    incident.updatedAt = new Date().toISOString();
    await incidentStore.save(incidentId, incident);

    await activityService.log(incidentId, 'severity_changed', 'auto-escalation', {
      from: old, to: newFullSeverity, reason: 'timeout'
    });

    const io = global.app?.get('io');
    io?.to(`incident:${incidentId}`).emit('incident:update', incident);
    io?.emit('escalation', { incidentId, from: old, to: newFullSeverity });

    console.log(`⬆️ Escalated ${incidentId}: ${old} → ${newFullSeverity}`);
  }
}

export default new EscalationService();
