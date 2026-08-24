import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const resolve = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      // Fora do bundler do Next não existe fronteira client/server a proteger.
      'server-only': resolve('./test/stubs/server-only.ts'),
      '@prisma-app': resolve('./generated/prisma'),
      '@': resolve('./src'),
    },
  },
});
