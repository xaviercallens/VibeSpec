import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  test: {
    include: ['packages/*/src/**/*.test.ts', 'tests/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    testTimeout: 30000,
  },
  resolve: {
    alias: {
      '@vibespec/schemas': resolve(__dirname, 'packages/schemas/src/index.ts'),
      '@vibespec/ingestion': resolve(__dirname, 'packages/ingestion/src/index.ts'),
      '@vibespec/neuro-sym': resolve(__dirname, 'packages/neuro-sym/src/index.ts'),
      '@vibespec/banana-gen': resolve(__dirname, 'packages/banana-gen/src/index.ts'),
      '@vibespec/antigravity-bridge': resolve(__dirname, 'packages/antigravity-bridge/src/index.ts'),
      '@vibespec/rl-validator': resolve(__dirname, 'packages/rl-validator/src/index.ts'),
      '@vibespec/cli': resolve(__dirname, 'packages/cli/src/index.ts'),
    },
  },
});
