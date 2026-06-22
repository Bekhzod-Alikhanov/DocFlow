/**
 * React hook + singleton client for the engine Web Worker.
 *
 * The worker is a long-lived module singleton (created lazily on first use, never
 * per-render). Requests are correlated by an incrementing id; the hook layers
 * *staleness suppression* on top: a slider drag fires many requests, and only the
 * most recent one's result is applied — earlier replies are dropped. There is no
 * true cancellation of an in-flight integration, but for sweeps/MC (hundreds of
 * ms) cooperative staleness is the right model.
 *
 * Testability: the client is obtained through `getWorkerClient()`, which can be
 * overridden with `__setWorkerClientForTests` so jsdom tests never construct a
 * real Worker (unsupported there).
 */
import { useEffect, useRef, useState } from 'react'
import type { Op, RequestFor, ResultFor, WorkerResponse, RequestEnvelope } from './protocol'

export interface WorkerClient {
  runTask<O extends Op>(req: RequestFor<O>): Promise<ResultFor<O>>
  terminate(): void
}

function createRealClient(): WorkerClient {
  const worker = new Worker(new URL('./engine.worker.ts', import.meta.url), { type: 'module' })
  const pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: unknown) => void }>()
  let nextId = 1

  worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
    const res = e.data
    const entry = pending.get(res.id)
    if (!entry) return
    pending.delete(res.id)
    if (res.ok) entry.resolve(res.result)
    else entry.reject(new Error(res.error))
  }
  worker.onerror = (e) => {
    const msg = e.message || 'worker crashed'
    for (const entry of pending.values()) entry.reject(new Error(msg))
    pending.clear()
  }

  return {
    runTask<O extends Op>(req: RequestFor<O>): Promise<ResultFor<O>> {
      const id = nextId++
      return new Promise<ResultFor<O>>((resolve, reject) => {
        pending.set(id, { resolve: resolve as (v: unknown) => void, reject })
        const envelope: RequestEnvelope = { id, req }
        worker.postMessage(envelope)
      })
    },
    terminate() {
      worker.terminate()
    },
  }
}

let client: WorkerClient | null = null

export function getWorkerClient(): WorkerClient {
  if (!client) client = createRealClient()
  return client
}

/** Test seam: inject a mock client, or pass null to reset to the lazy real one. */
export function __setWorkerClientForTests(c: WorkerClient | null): void {
  client = c
}

export interface TaskState<R> {
  loading: boolean
  result: R | null
  error: string | null
}

/**
 * Run a worker task, recomputing when `deps` change. Pass `req === null` to stay
 * idle (e.g. don't compute Sobol until its tab is opened). `deps` works exactly
 * like a `useEffect` dependency list and should capture everything `req` depends
 * on — the hook intentionally does not deep-compare the (large) request object.
 */
export function useWorkerTask<O extends Op>(
  req: RequestFor<O> | null,
  deps: React.DependencyList,
): TaskState<ResultFor<O>> {
  const [state, setState] = useState<TaskState<ResultFor<O>>>({
    loading: false,
    result: null,
    error: null,
  })
  const seqRef = useRef(0)

  useEffect(() => {
    // The synchronous setState calls below intentionally sync UI state to the
    // worker (an external system) the moment a request starts/clears; the result
    // and error are then applied from async callbacks. This is the sanctioned use.
    if (!req) {
      seqRef.current++ // invalidate any in-flight reply
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({ loading: false, result: null, error: null })
      return
    }
    const mySeq = ++seqRef.current
    setState((s) => ({ ...s, loading: true, error: null }))
    getWorkerClient()
      .runTask(req)
      .then((result) => {
        if (mySeq === seqRef.current) setState({ loading: false, result, error: null })
      })
      .catch((err: unknown) => {
        if (mySeq === seqRef.current)
          setState({ loading: false, result: null, error: err instanceof Error ? err.message : String(err) })
      })
    // The caller-provided deps array is the contract for when to re-run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}
