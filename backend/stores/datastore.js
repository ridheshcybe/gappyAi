import incidentSchema from "../schemas/incident-schema.json" with { type: 'json' };

// In-memory key-value store providing the expected interface (save/fetch/query/update/delete/get/put).
// lemma-sdk v0.5.2 doesn't expose the factory methods the original code expected,
// so an in-memory store is used for development. It works without a running Lemma pod.

const store = new Map();

// Store schema for inspection
store.set('__schema__', incidentSchema);

const incidentStore = {
  save(id, data) {
    store.set(id, data);
    return Promise.resolve(data);
  },

  fetch(id) {
    return Promise.resolve(store.get(id) || null);
  },

  query(filter = {}) {
    // Return only entries that look like incidents (have incidentId or classification)
    // to avoid leaking activity logs, chat histories, configs, etc.
    const all = Array.from(store.values());
    const incidents = all.filter(item =>
      item && typeof item === 'object' &&
      (item.incidentId || item.classification)
    );

    if (filter.status) {
      return Promise.resolve(incidents.filter(e => e.status === filter.status));
    }

    return Promise.resolve(incidents);
  },

  update(id, data) {
    const existing = store.get(id);
    if (!existing) return Promise.resolve(null);
    const updated = { ...existing, ...data };
    store.set(id, updated);
    return Promise.resolve(updated);
  },

  delete(id) {
    return Promise.resolve(store.delete(id));
  },

  // Aliases for backward compat with code that uses get/put naming
  get(key) {
    return Promise.resolve(store.get(key) || null);
  },

  put(key, data) {
    store.set(key, data);
    return Promise.resolve(data);
  },

  /** Clear all data (used in tests) */
  clear() {
    store.clear();
    // Re-add schema
    store.set('__schema__', incidentSchema);
    return Promise.resolve();
  }
};

export default incidentStore;
