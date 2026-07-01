// Vitest global setup. Registers @testing-library/jest-dom matchers for component
// tests; harmless for the Node-environment engine tests (only extends `expect`).
import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { useStore } from '../state/store'
import { useTabletopStore } from '../state/tabletopStore'

// The Zustand stores are module singletons, so state mutated by one test (e.g. a
// tabletop handoff setting mode='scientific'/view='tipping', or a scenario test
// calling start/choose/selectScenario) otherwise leaks into the next test in the
// same worker. Reset both stores to their initial snapshot — and clear
// localStorage — after every test so each test starts from a clean slate
// regardless of run order. Runs for all test files, including the Node-env
// engine tests; importing the stores there is harmless (pure JS, no DOM access
// at import time).
afterEach(() => {
  useStore.setState({ ...useStore.getInitialState() }, true)
  useTabletopStore.setState({ ...useTabletopStore.getInitialState() }, true)
  if (typeof localStorage !== 'undefined') localStorage.clear()
})
