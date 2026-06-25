import { vi } from 'vitest';

// Mock store implementation
const mockStoreImpl = {
  save: vi.fn().mockResolvedValue(undefined),
  fetch: vi.fn().mockResolvedValue(null)
};

// Mock agent implementation
const mockAgentImpl = {
  run: vi.fn().mockResolvedValue({ text: JSON.stringify({}) }),
  analyze: vi.fn().mockResolvedValue({}),
  generate: vi.fn().mockResolvedValue({}),
  format: vi.fn().mockResolvedValue('mock notification')
};

// Mock embedding model implementation
const mockEmbeddingModelImpl = {
  embed: vi.fn().mockResolvedValue([0.1, 0.2, 0.3])
};

// Mock lemma instance
const mockLemmaInstance = {
  datastore: vi.fn(() => mockStoreImpl),
  documentStore: vi.fn(() => mockStoreImpl),
  agent: vi.fn(() => mockAgentImpl),
  embedding: vi.fn(() => mockEmbeddingModelImpl)
};

// Export the mocked classes
export const Lemma = vi.fn().mockImplementation(() => mockLemmaInstance);
export const LemmaClient = vi.fn();

// Export the mock implementations so tests can modify them
export { mockStoreImpl, mockAgentImpl, mockEmbeddingModelImpl };