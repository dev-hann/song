import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    isolate: false,
    maxWorkers: 1,
  },
  resolve: {
    alias: {
      '@test': path.resolve(__dirname, './tests'),
    },
  },
});
