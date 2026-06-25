// backend/api/topology.js
import topologyService from '../services/topology-service.js';

export async function getTopology(req, res) {
  try {
    const map = await topologyService.getIncidentMap();
    res.json(map);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}