// backend/api/assignment.js
import assignmentAgent from '../agents/assignment-agent.js';
import incidentStore from '../stores/datastore.js';
import activityService from '../services/activity-service.js';

export async function recommendAssignee(req, res) {
  try {
    const incident = await incidentStore.fetch(req.params.incidentId);
    if (!incident) return res.status(404).json({ error: 'not found' });
    const result = await assignmentAgent.recommend(incident, incident.history || {});
    res.json(result);
  } catch (err) {
    console.error('Recommend assignee error:', err);
    res.status(500).json({ error: err.message });
  }
}

export async function assignIncident(req, res) {
  try {
    const { incidentId } = req.params;
    const { assignee, reason } = req.body;
    const incident = await incidentStore.fetch(incidentId);
    if (!incident) return res.status(404).json({ error: 'not found' });

    incident.assignee = assignee;
    incident.assignedAt = new Date().toISOString();
    incident.updatedAt = new Date().toISOString();
    await incidentStore.save(incidentId, incident);

    await activityService.log(incidentId, 'assigned', req.user?.email || 'unknown', { assignee, reason });

    const io = global.app?.get('io');
    io?.to(`incident:${incidentId}`).emit('incident:update', incident);
    res.json(incident);
  } catch (err) {
    console.error('Assign incident error:', err);
    res.status(500).json({ error: err.message });
  }
}
