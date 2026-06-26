import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/tests/pipeline.test.js',
      '**/tests/triage-agent.test.js',
    ],
  },
});