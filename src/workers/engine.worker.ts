/**
 * Engine Web Worker. Runs the heavy analyses (Monte Carlo, bifurcation sweeps,
 * hysteresis, Sobol, PRCC) off the main thread so slider drags and rendering stay
 * responsive. It imports the pure engine barrel; it must never import anything
 * that touches the DOM (Plotly, React, lib/theme).
 *
 * Protocol: receives { id, req } envelopes, posts back { id, ok, result } or
 * { id, ok:false, error }. Errors are stringified — structured clone can't carry
 * Error prototypes reliably across all browsers.
 */
/// <reference lib="webworker" />
import {
  monteCarlo,
  sweep1D,
  sweep2D,
  hysteresis,
  sobolAnalysis,
  prccAnalysis,
  modelOutput,
} from '../engine'
import type { RequestEnvelope, WorkerResponse, WorkerRequest } from './protocol'

function run(req: WorkerRequest): unknown {
  switch (req.op) {
    case 'monteCarlo':
      return monteCarlo(req.base, req.init, req.config)
    case 'sweep1D':
      return sweep1D(req.params, req.leverId, req.opts)
    case 'sweep2D':
      return sweep2D(req.params, req.xId, req.yId, req.opts)
    case 'hysteresis':
      return hysteresis(req.params, req.leverId, req.opts)
    case 'sobol': {
      const output = modelOutput(req.output, req.init, req.settings)
      return sobolAnalysis(req.base, req.keys, output, req.opts)
    }
    case 'prcc': {
      const output = modelOutput(req.output, req.init, req.settings)
      return prccAnalysis(req.base, req.keys, output, req.opts)
    }
  }
}

self.onmessage = (e: MessageEvent<RequestEnvelope>) => {
  const { id, req } = e.data
  let response: WorkerResponse
  try {
    response = { id, ok: true, result: run(req) }
  } catch (err) {
    response = { id, ok: false, error: err instanceof Error ? err.message : String(err) }
  }
  ;(self as unknown as Worker).postMessage(response)
}
