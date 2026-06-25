// backend/services/history-service.js
import datastore from '../stores/datastore.js';
import embeddingService from './embedding-service.js';

class HistoryService {
  async indexIncident(incident) {
    const vector = await embeddingService.embedIncident(incident);
    const record = {
      id: incident.id,
      vector,
      title: incident.title,
      service: incident.service,
      severity: incident.severity,
      rootCause: incident.rootCause?.rootCause,
      resolution: incident.resolution,
      resolutionTimeMin: incident.resolutionTimeMin,
      resolvedBy: incident.resolvedBy,
      createdAt: incident.createdAt,
      resolvedAt: incident.resolvedAt
    };
    await datastore.put(`hist:${incident.id}`, record);
    return record;
  }

  async findSimilar(incident, topK = 5) {
    const queryVector = await embeddingService.embedIncident(incident);

    const all = await datastore.query({ prefix: 'hist:' });
    const scored = all.map(record => ({
      ...record,
      similarity: embeddingService.cosineSimilarity(queryVector, record.vector)
    }));

    return scored
      .filter(r => r.similarity > 0.75)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  async summarizeHistory(matches) {
    if (!matches.length) {
      return { seen: false, count: 0 };
    }

    const avgResolution = matches.reduce((sum, m) => sum + (m.resolutionTimeMin || 0), 0) / matches.length;
    const best = matches.find(m => m.resolution && m.resolutionTimeMin);

    // Find most common resolution action
    const resolutionCounts = {};
    matches.forEach(m => {
      const key = m.resolution || 'unknown';
      resolutionCounts[key] = (resolutionCounts[key] || 0) + 1;
    });
    const topResolution = Object.entries(resolutionCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0];

    return {
      seen: true,
      count: matches.length,
      avgResolutionMin: Math.round(avgResolution),
      bestFix: topResolution,
      topMatch: {
        title: best?.title,
        similarity: best?.similarity,
        resolution: best?.resolution,
        resolutionTimeMin: best?.resolutionTimeMin
      },
      matches: matches.map(m => ({
        id: m.id,
        title: m.title,
        similarity: m.similarity,
        service: m.service,
        resolutionTimeMin: m.resolutionTimeMin
      }))
    };
  }
}

export default new HistoryService();