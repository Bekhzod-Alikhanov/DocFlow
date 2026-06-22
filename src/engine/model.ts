/**
 * The DocFlow model — pure functional form of the system dynamics (spec §2.2–2.3).
 *
 * Two reinforcing feedback loops compete:
 *   R1 (chilling): low culture → low documentation → less learning, rising debt
 *                  → more harm/exposure → (via backfire) still lower culture.
 *   R2 (translation layer): privilege + just culture + separation + translation
 *                  → safe documenting → learning → remediation wins → higher culture.
 *
 * The logistic culture stock C (dC/dt ∝ C·(1−C)) coupled to the sigmoidal
 * documentation fraction f_doc(C) is what makes the system bistable.
 *
 * Everything here is pure: same inputs → same outputs, no side effects, no clock,
 * no globals. Numerical guards keep the right-hand side finite without silently
 * hiding divergence (the integrator records clamp events).
 */
import type { State, Params, Auxiliaries } from './types'

export function sigmoid(x: number): number {
  // Numerically stable logistic.
  if (x >= 0) {
    const z = Math.exp(-x)
    return 1 / (1 + z)
  }
  const z = Math.exp(x)
  return z / (1 + z)
}

export function relu(x: number): number {
  return x > 0 ? x : 0
}

/**
 * Perceived discoverability (spec §2.2). Signed: compulsion (mandatory reporting)
 * and the PLD adverse-inference regime raise it; privilege, recipient–enforcer
 * separation, and a translation layer lower it. Only its positive part chills
 * the drive to document (via relu in `driveToDocument`).
 */
export function perceivedDiscoverability(p: Params): number {
  return (
    p.w_m * p.mandatory_reporting +
    p.w_p * p.pld_penalty -
    p.w_priv * p.privilege_strength -
    p.w_sep * p.recipient_enforcer_separation -
    p.w_tl * p.translation_layer
  )
}

/**
 * Net drive to document (spec §2.2). Culture C is the dynamic input; just culture
 * and mandatory reporting add directly; positive perceived discoverability subtracts.
 */
export function driveToDocument(C: number, pd: number, p: Params): number {
  return p.a_c * C + p.a_jc * p.just_culture + p.a_m * p.mandatory_reporting - p.a_disc * relu(pd)
}

/** Documentation fraction f_doc ∈ (0,1): the central nonlinearity (spec §2.2). */
export function documentationFraction(C: number, p: Params): number {
  const pd = perceivedDiscoverability(p)
  const drive = driveToDocument(C, pd, p)
  return sigmoid(p.gain * (drive - p.threshold))
}

/**
 * Compute all auxiliary (derived) quantities for a given state and parameters.
 * These feed both the derivatives and the charts.
 */
export function computeAux(s: State, p: Params): Auxiliaries {
  const { U, D, TD, L, E: _E, C } = s
  void _E // E does not drive any auxiliary; it is a pure observable (see MODEL.md).

  const perceived_discoverability = perceivedDiscoverability(p)
  const drive_to_document = driveToDocument(C, perceived_discoverability, p)
  const f_doc = sigmoid(p.gain * (drive_to_document - p.threshold))

  // Incident generation rises with debt, falls with capability. The capability
  // factor is floored at 0 so inflow can never go negative (spec §2.3 guard).
  //
  // REFINEMENT (documented in MODEL.md): the spec's linear debt term
  // (1 + alpha_td·TD/TD_ref) is unbounded and makes the chilling regime diverge
  // (TD → ∞), which would also preclude fixed-point analysis. We use a SATURATING
  // (Michaelis–Menten) amplification instead, so the debt→incident feedback has a
  // finite ceiling (1 + alpha_td·td_sat). Sign and low-debt slope are unchanged.
  const capabilityFactor = Math.max(0, 1 - p.beta_L * (L / 100))
  const debtRatio = TD / p.TD_ref
  const debtAmplification = 1 + p.alpha_td * (debtRatio / (1 + debtRatio / p.td_sat))
  const incident_inflow = Math.max(0, p.base_incident_rate * debtAmplification * capabilityFactor)

  const to_D = f_doc * incident_inflow
  const to_U = (1 - f_doc) * incident_inflow

  const translation_layer_efficiency = p.base_eff + p.tl_boost * p.translation_layer
  const learning_gain = p.eta_learn * to_D * translation_layer_efficiency
  const remediation = p.rho * D * (L / 100)
  const d_closeout = p.kappa_D * D

  const belated_doc = p.mu * U * f_doc
  const u_to_debt = p.sigma * U

  // Debt surfaces as harm, mitigated by capability (floored at 0).
  const harm_events = p.gamma * TD * Math.max(0, 1 - L / 100)

  // Culture reinforcement / backfire (REFINED — see MODEL.md).
  // The spec tied these to remediation/to_D *volume*, but volume collapses in the
  // learning regime (few incidents), starving the reinforcement and making the
  // model monostable. We instead drive them by the documentation *fraction* f_doc
  // gated by protection: documenting is visibly safe & productive (safety_wins,
  // scaled by translation efficiency) UNLESS records get weaponized for lack of
  // privilege (backfire). This is what makes the culture loop genuinely bistable.
  const safety_wins = p.omega * f_doc * translation_layer_efficiency
  const backfire = p.psi * p.phi_doc * f_doc * (1 - p.privilege_strength)

  return {
    perceived_discoverability,
    drive_to_document,
    f_doc,
    incident_inflow,
    to_D,
    to_U,
    translation_layer_efficiency,
    learning_gain,
    remediation,
    d_closeout,
    belated_doc,
    u_to_debt,
    harm_events,
    safety_wins,
    backfire,
  }
}

/**
 * The right-hand side of the ODE system: dState/dt (spec §2.3).
 * Pure; takes a pre-computed aux bundle to avoid recomputation in the integrator.
 */
export function derivativesFromAux(s: State, p: Params, a: Auxiliaries): State {
  const dU = a.to_U - a.belated_doc - a.u_to_debt
  const dD = a.to_D + a.belated_doc - a.d_closeout
  // REFINEMENT (MODEL.md): added −delta_TD·TD natural debt retirement (refactoring,
  // deprecation, system replacement that happens independent of incident learning).
  // The spec omitted it; without it the chilling regime has no finite TD equilibrium.
  const dTD = a.u_to_debt + p.td_baseline - a.remediation - p.delta_TD * s.TD
  const dL = a.learning_gain - p.delta_L * s.L
  const dE =
    p.phi_doc * a.to_D * (1 - p.privilege_strength) +
    p.phi_harm * a.harm_events +
    p.phi_pld * p.pld_penalty * a.to_U -
    p.theta_E * s.E

  // Culture: logistic reinforcing stock with hysteresis (spec §2.3). The bracket
  // is the culture "target" pressure; C·(1−C) gives the bistable logistic shape.
  // a_jc_c weights the just-culture baseline (symmetric with the spec's a_sep) so
  // the bistable window sits at sensible lever values — see MODEL.md.
  const cultureTarget =
    p.a_jc_c * p.just_culture + p.a_sep * p.recipient_enforcer_separation + a.safety_wins - a.backfire
  const dC = p.lambda_C * (cultureTarget - s.C) * s.C * (1 - s.C)

  return { U: dU, D: dD, TD: dTD, L: dL, E: dE, C: dC }
}

/** Convenience: derivatives with aux computed internally. */
export function derivatives(s: State, p: Params): State {
  return derivativesFromAux(s, p, computeAux(s, p))
}
