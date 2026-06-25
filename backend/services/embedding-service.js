let _openai = null;

async function getOpenAI() {
  if (_openai) return _openai;
  if (!process.env.OPENAI_API_KEY) {
    console.warn("⚠️ OPENAI_API_KEY not set — embeddings will return mock vectors");
    return null;
  }
  const { default: OpenAI } = await import("openai");
  _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

class EmbeddingService {
  constructor() {
    this.cache = new Map();
  }

  async embed(text) {
    const normalized = text.trim().toLowerCase();
    if (this.cache.has(normalized)) return this.cache.get(normalized);

    const client = await getOpenAI();
    if (!client) {
      // Return a mock vector when OpenAI is not configured
      const mockVector = new Array(1536).fill(0).map(() => Math.random() * 0.01);
      this.cache.set(normalized, mockVector);
      return mockVector;
    }

    const response = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: normalized,
    });

    const vector = response.data[0].embedding;
    this.cache.set(normalized, vector);
    return vector;
  }

  async embedIncident(incident) {
    const text = [
      incident.triageAnalysis?.headline || incident.title,
      incident.classification?.affectedComponent || incident.service,
      incident.classification?.severity || incident.severity,
      incident.rootCause?.rootCause,
      ...(incident.rootCause?.evidence || []),
      ...(incident.rootCause?.affectedComponents || [])
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
