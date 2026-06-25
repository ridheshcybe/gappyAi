// backend/services/embedding-service.js
import Lemma from '../lemma-config.js';

class EmbeddingService {
  constructor() {
    this.model = Lemma.embedding({ model: 'text-embedding-3-small' });
    this.cache = new Map();
  }

  async embed(text) {
    const normalized = text.trim().toLowerCase();
    if (this.cache.has(normalized)) return this.cache.get(normalized);

    const vector = await this.model.embed(normalized);
    this.cache.set(normalized, vector);
    return vector;
  }

  async embedIncident(incident) {
    const text = [
      incident.title,
      incident.service,
      incident.severity,
      incident.rootCause?.rootCause,
      ...(incident.symptoms || []),
      ...(incident.tags || [])
    ].filter(Boolean).join(' | ');

    return this.embed(text);
  }

  cosineSimilarity(a, b) {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

export default new EmbeddingService();