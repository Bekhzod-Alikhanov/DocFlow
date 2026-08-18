/**
 * Boundary mapping — does suppression ever minimise total exposure, and when?
 *
 * This is the deliverable the epistemic stance was chosen for (ADR/0001). The brief
 * originally asked the model to "show that suppression is not a dominant strategy", and
 * that was restated during planning: a model that can only produce the paper's
 * conclusion is the same defect Phase 0 was written to detect. What the model must do is
 * REPRESENT BOTH OUTCOMES and locate the boundary between them. A region where
 * suppression wins is a first-class result here, not a bug.
 *
 * THE COMPARISON. Institutional design is held fixed and the LEGAL ENVIRONMENT is swept.
 * Two architectures are run through the same environment:
 *
 *   candid       the healthcare posture — pre-committed protected workflow, preserved
 *                factual record, high just culture (measured pi = 0.989)
 *   suppressive  the cybersecurity posture — post-hoc counsel engagement, oral-only
 *                analysis, minimal scaffolding (measured pi = 0.065)
 *
 * Suppression dominates at an environment point iff it yields strictly lower total
 * exposure `E_tot = v_pl·E_pl + v_reg·E_reg + v_fid·E_fid`.
 *
 * WHY THESE FOUR ENVIRONMENT PARAMETERS. They are the ones no firm controls and nobody
 * has measured, and they are exactly where the paper's argument is load-bearing:
 *
 *   p_court  probability a court credits a pre-committed telemetry tripwire. The paper
 *            concedes no court has ruled on its central device.
 *   v_reg    weight on regulatory exposure. Zero models a no-enforcement world, which
 *            is the world a sceptic will assume.
 *   v_fid    weight on fiduciary exposure. Explicitly permitted to be zero if Caremark
 *            is doctrinally near-dead (OPEN_QUESTIONS Q3).
 *   v_pl     weight on products-liability exposure, held at 1 as the normaliser, since
 *            only the ratios between the three channels affect which side wins.
 *
 * ALL FOUR ARE T4 — freely chosen, nothing measured. That is the reason for sweeping
 * rather than reporting a point: any single answer here would be an artefact of four
 * numbers nobody knows.
 */
import type { Params } from './types'
import { simulate } from './simulate'
import { computeAux } from './model'
import { paramsFromPreset, initFromPreset } from './scenario'
import { PRESET_BY_ID } from './presets'

const SETTINGS = { horizon: 240, dt: 0.5, solver: 'rk4' } as const

/** The four environment parameters, none of which a firm controls. */
export interface Environment {
  p_court: number
  v_pl: number
  v_reg: number
  v_fid: number
}

export interface ArchitectureOutcome {
  eTot: number
  ePl: number
  eReg: number
  eFid: number
  fDoc: number
  learning: number
}

export interface BoundaryPoint {
  env: Environment
  candid: ArchitectureOutcome
  suppressive: ArchitectureOutcome
  /** Positive when candour costs more exposure than suppression. */
  penaltyForCandour: number
  suppressionDominates: boolean
}

export interface BoundaryReport {
  points: BoundaryPoint[]
  /** Share of the swept environment box where suppression yields lower total exposure. */
  suppressionShare: number
  /** Largest exposure advantage suppression achieves anywhere in the box. */
  worstCandourPenalty: BoundaryPoint | null
  /** The point where candour wins by the most. */
  bestCandourMargin: BoundaryPoint | null
}

/** Institutional posture with the environment stripped out and replaced. */
function posture(presetId: string, env: Environment): Params {
  return { ...paramsFromPreset(PRESET_BY_ID[presetId]), ...env }
}

export function runArchitecture(presetId: string, env: Environment): ArchitectureOutcome {
  const p = posture(presetId, env)
  const r = simulate(initFromPreset(PRESET_BY_ID[presetId]), p, SETTINGS)
  const s = r.summary.finalState
  const a = computeAux(s, p)
  return {
    eTot: a.E_tot,
    ePl: s.E_pl,
    eReg: s.E_reg,
    eFid: s.E_fid,
    fDoc: r.summary.finalFdoc,
    learning: s.L,
  }
}

export function evaluateEnvironment(
  env: Environment,
  candidId = 'healthcare',
  suppressiveId = 'cybersecurity',
): BoundaryPoint {
  const candid = runArchitecture(candidId, env)
  const suppressive = runArchitecture(suppressiveId, env)
  const penaltyForCandour = candid.eTot - suppressive.eTot
  return { env, candid, suppressive, penaltyForCandour, suppressionDominates: penaltyForCandour > 0 }
}

function linspace(lo: number, hi: number, n: number): number[] {
  if (n <= 1) return [lo]
  return Array.from({ length: n }, (_, i) => lo + ((hi - lo) * i) / (n - 1))
}

/**
 * Sweep the environment box and report where each architecture wins.
 *
 * `v_pl` is held at 1 throughout: scaling all three weights together scales `E_tot` for
 * both architectures equally and cannot change which is lower, so only the ratios carry
 * information. Sweeping it too would triple the cost for no result.
 */
export function mapBoundary(
  steps = 6,
  candidId = 'healthcare',
  suppressiveId = 'cybersecurity',
): BoundaryReport {
  const points: BoundaryPoint[] = []
  for (const p_court of linspace(0, 1, steps)) {
    for (const v_reg of linspace(0, 3, steps)) {
      for (const v_fid of linspace(0, 3, steps)) {
        points.push(
          evaluateEnvironment({ p_court, v_pl: 1, v_reg, v_fid }, candidId, suppressiveId),
        )
      }
    }
  }
  const dominated = points.filter((pt) => pt.suppressionDominates)
  const sorted = [...points].sort((a, b) => b.penaltyForCandour - a.penaltyForCandour)
  return {
    points,
    suppressionShare: dominated.length / points.length,
    worstCandourPenalty: sorted[0] ?? null,
    bestCandourMargin: sorted[sorted.length - 1] ?? null,
  }
}

/**
 * The conditional the boundary-mapping stance is supposed to deliver: the threshold in
 * regulatory-exposure weight above which candour becomes the lower-exposure choice, at a
 * given `p_court` and `v_fid`. Returns null when one architecture wins across the whole
 * range — which is itself the answer, and a more useful one than an interpolated number.
 */
export function regulatoryThreshold(
  p_court: number,
  v_fid: number,
  steps = 40,
  candidId = 'healthcare',
  suppressiveId = 'cybersecurity',
): number | null {
  const grid = linspace(0, 3, steps)
  let previous: BoundaryPoint | null = null
  for (const v_reg of grid) {
    const pt = evaluateEnvironment({ p_court, v_pl: 1, v_reg, v_fid }, candidId, suppressiveId)
    if (previous && previous.suppressionDominates && !pt.suppressionDominates) {
      // Linear interpolation on the penalty, which crosses zero between the two points.
      const t = previous.penaltyForCandour / (previous.penaltyForCandour - pt.penaltyForCandour)
      return previous.env.v_reg + t * (pt.env.v_reg - previous.env.v_reg)
    }
    previous = pt
  }
  return null
}
