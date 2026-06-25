// backend/services/activity-service.js
import incidentStore from '../stores/datastore.js';
import { v4 as uuidv4 } from 'uuid';

class ActivityService {
  async log(incidentId, type, actor, payload = {}) {
    const activity = {
      id: uuidv4(),
      incidentId,
      type,        // created | severity_changed | assigned | status_changed | comment | ai_action
      actor,       // 'ai-triage' | 'ai-copilot' | 'sarah@team' | 'system'
      payload,
      ts: new Date().toISOString()
    };
    const key = `activity:${incidentId}`;
    const existing = await incidentStore.fetch(key) || { incidentId, events: [] };
    existing.events.push(activity);
    await incidentStore.save(key, existing);

    // Emit activity via WebSocket
    try {
      const io = global.app?.get('io');
      if (io) {
        io.to(`incident:${incidentId}`).emit("activity", activity);
        io.to("feed").emit("feed:update", activity);
      }
    } catch (err) {
      console.warn('Failed to emit activity via WebSocket:', err);
    }

    return activity;
  }

  async getForIncident(incidentId) {
    const record = await incidentStore.fetch(`activity:${incidentId}`);
    return record?.events || [];
  }

  async getFeed(limit = 50) {
    const all = await incidentStore.query({}) || [];
    const records = Array.isArray(all) ? all : Object.values(all);
    const events = records.filter(r => r.events).flatMap(r => r.events);
    return events.sort((a, b) => b.ts.localeCompare(a.ts)).slice(0, limit);
  }
}

export default new ActivityService();
