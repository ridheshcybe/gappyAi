// backend/services/escalation-service.js
import incidentStore from '../stores/datastore.js';
import activityService from './activity-service.js';

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
      const incidents = await incidentStore.query({ status: 'open' });
      const now = Date.now();

      for (const inc of incidents) {
        const rule = RULES[inc.severity];
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

  async escalate(incident, newSeverity) {
    const old = incident.severity;
    incident.severity = newSeverity;
    incident.escalatedAt = new Date().toISOString();
    incident.updatedAt = new Date().toISOString();
    await incidentStore.put(incident.id, incident);

    await activityService.log(incident.id, 'severity_changed', 'auto-escalation', {
      from: old, to: newSeverity, reason: 'timeout'
    });

    const io = global.app?.get('io');
    io?.to(`incident:${incident.id}`).emit('incident:update', incident);
    io?.emit('escalation', { incidentId: incident.id, from: old, to: newSeverity });

    console.log(`⬆️ Escalated ${incident.id}: ${old} → ${newSeverity}`);
  }
}

export default new EscalationService();