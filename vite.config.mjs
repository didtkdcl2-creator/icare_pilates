import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Each public-facing view is a standalone entry point, so Vercel receives all
// routes rather than only the landing page.
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        inquiry: resolve(import.meta.dirname, 'inquiry.html'),
        program: resolve(import.meta.dirname, 'program.html'),
        journal: resolve(import.meta.dirname, 'journal.html'),
        history: resolve(import.meta.dirname, 'history.html'),
      },
    },
  },
});
