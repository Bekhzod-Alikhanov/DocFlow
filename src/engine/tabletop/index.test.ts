import { describe, it, expect } from 'vitest'
import * as tabletop from './index'

describe('engine/tabletop barrel', () => {
  it('re-exports the public API', () => {
    for (const name of ['applyChoice', 'crossBoundary', 'recordCapturability', 'institutionalMeters', 'engineForwardOutcome', 'enumeratePaths', 'scoreAllPaths', 'hasDominantPath', 'initialIncidentMeters']) {
      expect(name in tabletop).toBe(true)
    }
  })
})
