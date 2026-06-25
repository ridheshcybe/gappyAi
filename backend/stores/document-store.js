// In-memory document store for raw alerts.
// Provides the expected interface (save/fetch) using an in-memory Map.

const store = new Map();

const rawAlertStore = {
  save(id, data) {
    store.set(id, data);
    return Promise.resolve(id);
  },

  fetch(id) {
    return Promise.resolve(store.get(id) || null);
  }
};

export default rawAlertStore;
