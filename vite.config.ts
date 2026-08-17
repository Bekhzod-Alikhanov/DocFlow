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
      // v0.3.0: coverage used to gate ONLY src/engine, leaving the recommendation
      // engine (lib/institutional.ts) and the exported playbook (lib/export.ts)
      // ungated — backwards relative to blast radius (AUDIT.md 8.5). It also used an
      // AGGREGATE threshold, so sensitivity.ts (75% branches) and monteCarlo.ts (80%)
      // passed by subsidy from 100%-covered tabletop files. perFile stops that.
      include: ['src/engine/**/*.ts', 'src/lib/**/*.ts', 'src/workers/**/*.ts'],
      exclude: [
        'src/**/*.{test,spec}.{ts,tsx}',
        'src/engine/**/index.ts',
        'src/lib/tabletop/scenarios/**',
        'src/workers/engine.worker.ts',
      ],
      // These are a RATCHET set just below currently-measured per-file coverage,
      // not a quality claim. Raise them as tests are added; never lower them to make
      // a failing build pass. Because perFile is on, each threshold binds on EVERY
      // file in its glob, so the weakest file sets the bar — which is the point.
      //
      // The lib floor is low because of two genuinely browser-only modules:
      // export.ts (canvas + jsPDF image paths) and useWorkerTask.ts (its real-Worker
      // client cannot be constructed in jsdom). They are NOT excluded, because
      // excluding them would hide the gap rather than record it.
      thresholds: {
        perFile: true,
        'src/engine/**/*.ts': { statements: 88, branches: 68, functions: 88, lines: 88 },
        'src/lib/**/*.ts': { statements: 40, branches: 33, functions: 45, lines: 40 },
        'src/workers/**/*.ts': { statements: 42, branches: 42, functions: 50, lines: 44 },
      },
    },
  },
})
