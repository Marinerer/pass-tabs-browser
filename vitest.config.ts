import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom', // Using jsdom for a browser-like environment
    globals: true,        // Enables global APIs like describe, it, expect
    alias: {
      '@/': '/app/', // Alias for resolving paths like in the application
    },
  },
});
