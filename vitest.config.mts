import path from 'node:path';
import { defineConfig } from 'vitest/config';
import { reactNative } from 'vitest-native';

export default defineConfig({
  plugins: [reactNative()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/assets': path.resolve(__dirname, './assets'),
    },
  },
  test: {
    globals: true,
    setupFiles: ['./src/tests/test-setup.ts'],
  },
});
