// backend/api/activity.js
import activityService from '../services/activity-service.js';

export async function getIncidentActivity(req, res) {
  const events = await activityService.getForIncident(req.params.incidentId);
  res.json({ events });
}

export async function getFeed(req, res) {
  const limit = parseInt(req.query.limit) || 50;
  const events = await activityService.getFeed(limit);
  res.json({ events });
}

export async function postActivity(req, res) {
  const { incidentId, type, actor, payload } = req.body;
  const activity = await activityService.log(incidentId, type, actor, payload);
  // Broadcast via WS
  req.app.get('io')?.to(`incident:${incidentId}`).emit('activity', activity);
  req.app.get('io')?.emit('feed:update', activity);
  res.status(201).json(activity);
}