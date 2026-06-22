/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// DocFlow — TS-only static build. See docs/ARCHITECTURE.md for the stack rationale.
// https://vite.dev/config/
export default defineConfig({
  base: './', // relative asset paths so the built site works from any static host / file open
  plugins: [react(), tailwindcss()],
  worker: {
    format: 'es',
  },
  build: {
    // Plotly, jsPDF, and each analytics view are intentionally code-split into
    // their own lazily-loaded chunks; the >500 kB warning would only flag those.
    chunkSizeWarningLimit: 5000,
  },
  test: {
    // Engine tests run in fast Node by default; component tests opt into jsdom
    // via a `// @vitest-environment jsdom` file directive.
    environment: 'node',
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      // The pure engine is the scientific core — hold it to a high bar (spec §7.1: ≥90%).
      include: ['src/engine/**/*.ts'],
      exclude: ['src/engine/**/*.{test,spec}.ts', 'src/engine/**/index.ts'],
      thresholds: {
        'src/engine/**/*.ts': {
          statements: 90,
          branches: 85,
          functions: 90,
          lines: 90,
        },
      },
    },
  },
})
