import { lemmaClient } from "../lemma-config.js";

// In-memory fallback store — used when Lemma pod is unavailable
const memoryStore = new Map();

const TABLE_NAME = 'alerts';

// Cache Lemma availability so we don't hammer the network on every operation
let _lemmaAvailable = null; // null = unchecked, true/false = cached

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

function extractRecord(response) {
  if (!response) return null;
  if (response.record) return response.record;
  return response;
}

/**
 * Store raw alert documents using the Lemma pod's Records API when available,
 * falling back to an in-memory Map when the pod is unreachable.
 */
const rawAlertStore = {
  async save(id, data) {
    try {
      const available = await checkLemmaAvailable();
      if (available) {
        const podId = lemmaClient.podId || 'default-pod';
        const client = lemmaClient.withPod(podId);
        // Always store as the original value so fetch returns consistent shapes
        await client.records.create(TABLE_NAME, { id, value: data });
      } else {
        memoryStore.set(id, data);
      }
    } catch {
      memoryStore.set(id, data);
    }
    return Promise.resolve(id);
  },

  async fetch(id) {
    try {
      const available = await checkLemmaAvailable();
      if (available) {
        const podId = lemmaClient.podId || 'default-pod';
        const client = lemmaClient.withPod(podId);
        const record = await client.records.get(TABLE_NAME, id);
        const extracted = extractRecord(record);
        if (extracted) return extracted.value ?? extracted;
        return null;
      }
    } catch {
      // Fall through to in-memory
    }
    return Promise.resolve(memoryStore.get(id) || null);
  }
};

export default rawAlertStore;
