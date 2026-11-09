import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // '@/messages' avant '@' : mêmes alias que tsconfig (messages/ est hors de src/)
    alias: [
      { find: '@/messages', replacement: fileURLToPath(new URL('./messages', import.meta.url)) },
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
    ],
  },
  // tsconfig impose jsx: "preserve" (Next compile lui-même le JSX) : Vitest doit le transformer pour les gabarits de courriels
  oxc: {
    jsx: { runtime: 'automatic', importSource: 'react' },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});