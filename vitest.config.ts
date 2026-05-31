import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: [
      'src/**/*.test.{ts,tsx}',
      'server/**/*.test.ts',
      'app/**/*.test.{ts,tsx}',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}', 'server/**/*.ts', 'app/**/*.ts'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.{ts,tsx}',
        '**/*.d.ts',
        '**/types/**',
        '**/constants/**',
        'src/types/**',
        'src/styles/**',
      ],
    },
    css: true,
  },
  resolve: {
    alias: [
      { find: '@/server', replacement: path.resolve(__dirname, './server') },
      { find: '@', replacement: path.resolve(__dirname, './src') },
    ],
  },
});
