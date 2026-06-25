// backend/services/remediation-service.js
import datastore from '../stores/datastore.js';
import activityService from './activity-service.js';

class RemediationService {
  async executeAction(incidentId, actionName, args = {}) {
    const incident = await datastore.get(incidentId);
    if (!incident) throw new Error('Incident not found');

    let resultLog = '';
    let resolved = false;

    // Simulate executing infrastructure actions
    switch (actionName) {
      case 'restart_service':
        await this._sleep(1000); // simulate API latency
        resultLog = `✅ Successfully restarted ${args.service}. Health check passed in 1.2s.`;
        break;
      case 'scale_up':
        await this._sleep(1200);
        resultLog = `✅ Scaled ${args.service} from 3 to 6 replicas. New pods active.`;
        break;
      case 'clear_cache':
        await this._sleep(800);
        resultLog = `✅ Flushed Redis cache. 4,200 keys evicted.`;
        break;
      case 'resolve_incident':
        incident.status = 'resolved';
        incident.resolvedAt = new Date().toISOString();
        incident.resolutionTimeMin = Math.round((new Date(incident.resolvedAt) - new Date(incident.createdAt)) / 60000);
        incident.resolution = args.note || 'Resolved via AI Copilot';
        await datastore.put(incidentId, incident);
        resultLog = `✅ Incident ${incidentId} marked as resolved.`;
        resolved = true;
        break;
      default:
        resultLog = `❌ Unknown action: ${actionName}`;
    }

    // Log to activity feed
    await activityService.log(incidentId, 'auto_remediation', 'ai-copilot', {
      action: actionName,
      args,
      result: resultLog
    });

    // Emit WebSocket event for real-time UI update
    const io = global.app?.get('io');
    if (io) {
      io.to(`incident:${incidentId}`).emit('remediation_log', { incidentId, log: resultLog });
      if (resolved) {
        io.to(`incident:${incidentId}`).emit('incident:update', incident);
        io.emit('feed:update', { incidentId, type: 'resolved', actor: 'ai-copilot' });
      }
    }

    return { success: true, log: resultLog, resolved };
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new RemediationService();