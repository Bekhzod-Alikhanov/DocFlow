// src/engine/tabletop/capturability.test.ts
import { describe, it, expect } from 'vitest'
import { recordCapturability } from './capturability'

describe('Ch.4 record capturability', () => {
  it('is 0–100 and rises when state is snapshotted before retraining', () => {
    const skipped = recordCapturability({ resistance: 'irreproducible', retrainCadence: 0.7, stateSnapshotted: false, pipelineCaptured: false })
    const captured = recordCapturability({ resistance: 'irreproducible', retrainCadence: 0.7, stateSnapshotted: true, pipelineCaptured: true })
    expect(captured).toBeGreaterThan(skipped)
    expect(skipped).toBeGreaterThanOrEqual(0)
    expect(captured).toBeLessThanOrEqual(100)
  })

  it('silent/irreproducible failures are harder to capture than distributional', () => {
    const opts = { retrainCadence: 0.5, stateSnapshotted: true, pipelineCaptured: true } as const
    const silent = recordCapturability({ resistance: 'silent', ...opts })
    const distributional = recordCapturability({ resistance: 'distributional', ...opts })
    expect(silent).toBeLessThan(distributional)
  })

  it('high retrain cadence erodes capturability when nothing was snapshotted', () => {
    const slow = recordCapturability({ resistance: 'malfunction' as never, retrainCadence: 0.1, stateSnapshotted: false, pipelineCaptured: false })
    const fast = recordCapturability({ resistance: 'malfunction' as never, retrainCadence: 0.95, stateSnapshotted: false, pipelineCaptured: false })
    expect(fast).toBeLessThan(slow)
  })
})
