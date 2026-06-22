// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor, cleanup } from '@testing-library/react'
import {
  useWorkerTask,
  __setWorkerClientForTests,
  type WorkerClient,
} from './useWorkerTask'
import type { Op, RequestFor, ResultFor } from './protocol'
import { defaultParams } from '../engine'

function deferred<T>() {
  let resolve!: (v: T) => void
  let reject!: (e: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

interface Call {
  req: RequestFor<Op>
  d: ReturnType<typeof deferred<unknown>>
}

let calls: Call[]
let mockClient: WorkerClient

beforeEach(() => {
  calls = []
  mockClient = {
    runTask<O extends Op>(req: RequestFor<O>): Promise<ResultFor<O>> {
      const d = deferred<unknown>()
      calls.push({ req: req as RequestFor<Op>, d })
      return d.promise as Promise<ResultFor<O>>
    },
    terminate() {},
  }
  __setWorkerClientForTests(mockClient)
})

afterEach(() => {
  cleanup()
  __setWorkerClientForTests(null)
})

const sweepReq = (steps: number): RequestFor<'sweep1D'> => ({
  op: 'sweep1D',
  params: defaultParams(),
  leverId: 'just_culture',
  opts: { steps },
})

const fakeResult = (n: number) =>
  ({ leverId: 'just_culture', metric: 'f_doc', points: [], tippingValues: [n] }) as unknown as ResultFor<'sweep1D'>

describe('useWorkerTask', () => {
  it('transitions loading → result', async () => {
    const { result } = renderHook(() => useWorkerTask(sweepReq(10), [10]))
    expect(result.current.loading).toBe(true)
    expect(result.current.result).toBeNull()

    await act(async () => {
      calls[0].d.resolve(fakeResult(1))
    })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.result).toEqual(fakeResult(1))
    expect(result.current.error).toBeNull()
  })

  it('surfaces errors', async () => {
    const { result } = renderHook(() => useWorkerTask(sweepReq(10), [10]))
    await act(async () => {
      calls[0].d.reject(new Error('boom'))
    })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('boom')
    expect(result.current.result).toBeNull()
  })

  it('stays idle when req is null', () => {
    const { result } = renderHook(() => useWorkerTask(null, []))
    expect(result.current.loading).toBe(false)
    expect(result.current.result).toBeNull()
    expect(calls).toHaveLength(0)
  })

  it('suppresses a stale response (fire A then B, resolve A last → A ignored)', async () => {
    const { result, rerender } = renderHook(
      ({ steps }: { steps: number }) => useWorkerTask(sweepReq(steps), [steps]),
      { initialProps: { steps: 10 } },
    )
    // Second request supersedes the first.
    rerender({ steps: 20 })
    expect(calls).toHaveLength(2)

    // Resolve the LATEST (B) first, then the stale (A) last.
    await act(async () => {
      calls[1].d.resolve(fakeResult(2))
    })
    await waitFor(() => expect(result.current.result).toEqual(fakeResult(2)))

    await act(async () => {
      calls[0].d.resolve(fakeResult(1))
    })
    // A must NOT overwrite B.
    expect(result.current.result).toEqual(fakeResult(2))
  })
})
