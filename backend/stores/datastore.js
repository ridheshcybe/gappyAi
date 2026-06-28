import incidentSchema from "../schemas/incident-schema.json" with { type: 'json' };
import { lemmaClient } from "../lemma-config.js";

// In-memory fallback store — used when Lemma pod is unavailable
const memoryStore = new Map();
memoryStore.set('__schema__', incidentSchema);

const TABLE_NAME = 'incidents';

// Cache Lemma availability so we don't hammer the network on every operation
let _lemmaAvailable = null; // null = unchecked, true/false = cached

/**
 * Check whether the Lemma pod is reachable.
 * Cache result so subsequent operations skip the network call.
 */
async function checkLemmaAvailable() {
  if (_lemmaAvailable !== null) return _lemmaAvailable;
  try {
    const podId = lemmaClient.podId || 'default-pod';
    const client = lemmaClient.withPod(podId);
    await client.records.list(TABLE_NAME, { limit: 1 });
    _lemmaAvailable = true;
  } catch {
    _lemmaAvailable = false;
  }
  return _lemmaAvailable;
}

/**
 * Extract items from a Lemma `records.list()` response.
 * The API may return a bare array or `{ records: [...], total: ... }`.
 */
function extractRecords(response) {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (response.records && Array.isArray(response.records)) return response.records;
  return [];
}

/**
 * Extract a single record from `records.get()` response.
 * The API may return the record directly or wrap it in `{ record: {...} }`.
 */
function extractRecord(response) {
  if (!response) return null;
  if (response.record) return response.record;
  return response;
}

/**
 * Store incidents using the Lemma pod's Records API when available,
 * falling back to an in-memory Map when the pod is unreachable.
 */
const incidentStore = {
  async _getClient() {
    const available = await checkLemmaAvailable();
    if (!available) return null;
    try {
      const podId = lemmaClient.podId || 'default-pod';
      return lemmaClient.withPod(podId);
    } catch {
      return null;
    }
  },

  async save(id, data) {
    try {
      const client = await this._getClient();
      if (client) {
        await client.records.create(TABLE_NAME, data);
      } else {
        memoryStore.set(id, data);
      }
    } catch {
      memoryStore.set(id, data);
    }
    return Promise.resolve(data);
  },

  async fetch(id) {
    try {
      const client = await this._getClient();
      if (client) {
        const record = await client.records.get(TABLE_NAME, id);
        const extracted = extractRecord(record);
        if (extracted) return extracted;
        return null;
      }
    } catch {
      // Fall through to in-memory
    }
    return Promise.resolve(memoryStore.get(id) || null);
  },

  async query(filter = {}) {
    try {
      const client = await this._getClient();
      if (client) {
        const response = await client.records.list(TABLE_NAME, {});
        const all = extractRecords(response);
        const incidents = all.filter(item =>
          item && typeof item === 'object' &&
          (item.incidentId || item.classification)
        );
        if (filter.status) {
          return Promise.resolve(incidents.filter(e => e.status === filter.status));
        }
        return Promise.resolve(incidents);
      }
    } catch {
      // Fall through to in-memory
    }

    // In-memory fallback
    const all = Array.from(memoryStore.values());
    const incidents = all.filter(item =>
      item && typeof item === 'object' &&
      (item.incidentId || item.classification)
    );
    if (filter.status) {
      return Promise.resolve(incidents.filter(e => e.status === filter.status));
    }
    return Promise.resolve(incidents);
  },

  async update(id, data) {
    try {
      const client = await this._getClient();
      if (client) {
        const updated = await client.records.update(TABLE_NAME, id, data);
        return extractRecord(updated);
      }
    } catch {
      // Fall through to in-memory
    }
    const existing = memoryStore.get(id);
    if (!existing) return Promise.resolve(null);
    const updated = { ...existing, ...data };
    memoryStore.set(id, updated);
    return Promise.resolve(updated);
  },

  async delete(id) {
    try {
      const client = await this._getClient();
      if (client) {
        await client.records.delete(TABLE_NAME, id);
        return true;
      }
    } catch {
      // Fall through to in-memory
    }
    return Promise.resolve(memoryStore.delete(id));
  },

  // Aliases for backward compat
  async get(key) {
    return this.fetch(key);
  },

  async put(key, data) {
    return this.save(key, data);
  },

  /** Clear all data (used in tests) */
  async clear() {
    memoryStore.clear();
    memoryStore.set('__schema__', incidentSchema);
    // Reset Lemma cache so next operation re-checks
    _lemmaAvailable = null;
    try {
      const client = await this._getClient();
      if (client) {
        const response = await client.records.list(TABLE_NAME, {});
        const records = extractRecords(response);
        for (const r of records) {
          try { await client.records.delete(TABLE_NAME, r.id || r.incidentId); } catch {}
        }
      }
    } catch {
      // In-memory clear is sufficient
    }
    return Promise.resolve();
  }
};

export default incidentStore;
