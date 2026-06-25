// backend/api/history.js
import historyService from '../services/history-service.js';
import incidentStore from '../stores/datastore.js';

export async function getHistory(req, res) {
  const { incidentId } = req.params;
  const incident = await incidentStore.fetch(incidentId);
  if (!incident) return res.status(404).json({ error: 'not found' });

  const matches = await historyService.findSimilar(incident, 5);
  const summary = await historyService.summarizeHistory(matches);
  res.json(summary);
}
