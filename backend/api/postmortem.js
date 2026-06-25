// backend/api/postmortem.js
import postMortemAgent from '../agents/postmortem-agent.js';
import incidentStore from '../stores/datastore.js';
import activityService from '../services/activity-service.js';

export async function generatePostMortem(req, res) {
  try {
    const pm = await postMortemAgent.generate(req.params.incidentId);
    const key = `postmortem:${req.params.incidentId}`;
    await incidentStore.save(key, pm);

    await activityService.log(req.params.incidentId, 'ai_action', 'ai-postmortem', {
      action: 'generated'
    });

    res.json(pm);
  } catch (err) {
    console.error('Generate post-mortem error:', err);
    res.status(500).json({ error: err.message });
  }
}

export async function getPostMortem(req, res) {
  try {
    const pm = await incidentStore.fetch(`postmortem:${req.params.incidentId}`);
    if (!pm) return res.status(404).json({ error: 'not generated yet' });
    res.json(pm);
  } catch (err) {
    console.error('Get post-mortem error:', err);
    res.status(500).json({ error: err.message });
  }
}
