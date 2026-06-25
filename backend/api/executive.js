// backend/api/executive.js
import metricsService from '../services/metrics-service.js';

export async function getExecMetrics(req, res) {
  try {
    const metrics = await metricsService.compute();
    res.json(metrics);
  } catch (err) {
    console.error('Executive metrics error:', err);
    res.status(500).json({ error: err.message });
  }
}