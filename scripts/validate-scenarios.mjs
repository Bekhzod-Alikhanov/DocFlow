// scripts/validate-scenarios.mjs
// Compiled-free guard for CI: import the built scenarios via tsx-less dynamic import
// is not available, so this script shells vitest's validation test instead.
import { execSync } from 'node:child_process'
execSync('npx vitest run src/lib/tabletop/scenarios/production-incident.test.ts src/lib/tabletop/schema.test.ts', { stdio: 'inherit' })
