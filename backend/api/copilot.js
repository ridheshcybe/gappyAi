// backend/api/copilot.js
import copilotAgent from '../agents/copilot-agent.js';

export async function copilotChat(req, res) {
  try {
    const { incidentId, message, conversation } = req.body;
    if (!incidentId || !message) {
      return res.status(400).json({ error: 'incidentId and message required' });
    }
    const result = await copilotAgent.chat({ incidentId, message, conversation });
    res.json(result);
  } catch (err) {
    console.error('Copilot error:', err);
    res.status(500).json({ error: err.message });
  }
}

export async function getConversation(req, res) {
  try {
    const { copilotAgent } = await import('../agents/copilot-agent.js');
    const messages = await copilotAgent.getConversation(req.params.incidentId);
    res.json({ messages });
  } catch (err) {
    console.error('Get conversation error:', err);
    res.status(500).json({ error: err.message });
  }
}