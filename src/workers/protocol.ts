/**
 * Typed RPC protocol shared between the main thread (useWorkerTask) and the
 * engine Web Worker. Pure types only — no DOM, no engine code — so it can be
 * imported from both sides without dragging the worker bundle into the app.
 *
 * Each request is a tagged union member discriminated by `op`. Sobol/PRCC carry
 * `init` + `settings` (not a closure) because the worker has to rebuild the
 * scalar output function `modelOutput(name, init, settings)` on its own side —
 * functions can't survive `postMessage`'s structured clone.
 */
import type {
  Params,
  State,
  SimSettings,
  LeverKey,
  ParamKey,
} from '../engine'
import type {
  MonteCarloConfig,
  MonteCarloResult,
  Sweep1DResult,
  Sweep2DResult,
  HysteresisResult,
  SobolResult,
  PrccResult,
  Metric,
  OutputName,
} from '../engine'

export type WorkerRequest =
  | { op: 'monteCarlo'; base: Params; init: State; config: MonteCarloConfig }
  | {
      op: 'sweep1D'
      params: Params
      leverId: LeverKey
      opts?: { min?: number; max?: number; steps?: number; metric?: Metric }
    }
  | {
      op: 'sweep2D'
      params: Params
      xId: LeverKey
      yId: LeverKey
      opts?: { init?: State; settings?: SimSettings; nx?: number; ny?: number; metric?: Metric }
    }
  | {
      op: 'hysteresis'
      params: Params
      leverId: LeverKey
      opts?: { min?: number; max?: number; steps?: number; metric?: Metric; init?: State; settings?: SimSettings }
    }
  | {
      op: 'sobol'
      base: Params
      keys: ParamKey[]
      output: OutputName
      init: State
      settings: SimSettings
      opts?: { n?: number; seed?: number }
    }
  | {
      op: 'prcc'
      base: Params
      keys: ParamKey[]
      output: OutputName
      init: State
      settings: SimSettings
      opts?: { n?: number; seed?: number }
    }

/** op → its result type. */
export interface ResultMap {
  monteCarlo: MonteCarloResult
  sweep1D: Sweep1DResult
  sweep2D: Sweep2DResult
  hysteresis: HysteresisResult
  sobol: SobolResult
  prcc: PrccResult
}

export type Op = WorkerRequest['op']
export type RequestFor<O extends Op> = Extract<WorkerRequest, { op: O }>
export type ResultFor<O extends Op> = ResultMap[O]

/** Wire envelope: a request tagged with a correlation id. */
export interface RequestEnvelope {
  id: number
  req: WorkerRequest
}

export type WorkerResponse =
  | { id: number; ok: true; result: unknown }
  | { id: number; ok: false; error: string }
