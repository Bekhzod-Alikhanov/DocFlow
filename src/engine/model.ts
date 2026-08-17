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
import {
  ACCOUNTABILITY_LEGITIMACY,
  LITIGATION_PRESSURE,
  NEAR_MISS_SIGNAL,
  POLICY_SCAFFOLD,
  PRIVATE_ORDERABLE_LEVERS,
  PRIVATE_ORDERING,
  PROTECTION_BUNDLE,
  SAFE_TO_REPORT,
} from './readouts'

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
 * Smooth (C¹) approximation to `relu`: softplus_β(x) = ln(1 + e^{βx}) / β.
 *
 * v0.3.0, partially addressing AUDIT.md F15. Be precise about what this does and
 * does not buy, because the obvious justification for it is wrong:
 *
 * WHAT IT DOES NOT FIX. `perceivedDiscoverability` is a function of PARAMETERS
 * ONLY — it does not read the state — so PD is constant along any trajectory and
 * an integrating solution can never cross the kink. The kink therefore does not
 * degrade RK4's order, and it does not corrupt the STATE Jacobian used for
 * stability classification. Measured: observed order is unchanged by this switch
 * (cyber 2.26, contested 2.12, aviation 4.06 before and after).
 *
 * WHAT IT DOES FIX. The kink lives in *parameter* space, which is exactly the
 * space the v0.3 analysis machinery works in. Lever sweeps, bifurcation
 * continuation, tornado swings and Sobol/PRCC all differentiate or interpolate
 * across PD = 0, and a C⁰ point there produces a spurious corner in every one of
 * those curves.
 *
 * WHAT IT ALSO DOES NOT FIX. The nine discoverability weights are still
 * effectively inert wherever PD ≪ 0 (six of eight presets): softplus′ = σ(βx), so
 * at aviation's PD = −2.67 with β = 20 the gradient is ~1e-23. That inertness is a
 * property of the one-sided penalty design, not of the kink, and it remains open.
 *
 * Cost: a small positive bias near the crossing, softplus_β(0) = ln2/β = 0.035 at
 * the default β = 20. No shipped preset sits near PD = 0, so measured preset
 * behaviour is unchanged to four decimal places.
 */
export function softplus(x: number, beta: number): number {
  const z = beta * x
  // Guard both tails: exp overflows above ~709 and underflows below ~-745.
  if (z > 30) return x // ln(1+e^z)/β → x
  if (z < -30) return Math.exp(z) / beta // → 0⁺
  return Math.log1p(Math.exp(z)) / beta
}

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x))
}

/**
 * Perceived discoverability (spec §2.2). Signed: compulsion (mandatory reporting)
 * and the PLD adverse-inference regime raise it; privilege, recipient–enforcer
 * separation, translation architecture, workflow protection, original-records
 * boundaries, and safe-harbor/non-admission rules lower it. Only its positive
 * part chills the drive to document (via softplus in `driveToDocument`).
 *
 * NOTE: this reads parameters only, never state, so PD is constant along a
 * trajectory. Several properties elsewhere depend on that fact — see `softplus`.
 */
export function perceivedDiscoverability(p: Params): number {
  return (
    p.w_m * p.mandatory_reporting +
    p.w_p * p.pld_penalty -
    p.w_priv * p.privilege_strength -
    p.w_sep * p.recipient_enforcer_separation -
    p.w_tl * p.translation_layer -
    p.w_workflow * p.workflow_protection -
    p.w_records * p.original_records_boundary -
    p.w_safe * p.safe_harbor_non_admission
  )
}

/**
 * Net drive to document (spec §2.2). Culture C is the dynamic input; just culture
 * and mandatory reporting add directly; positive perceived discoverability subtracts.
 */
export function driveToDocument(C: number, pd: number, p: Params): number {
  return (
    p.a_c * C +
    p.a_jc * p.just_culture +
    p.a_m * p.mandatory_reporting -
    p.a_disc * softplus(pd, p.pd_sharpness)
  )
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
  // v0.3.0: E is no longer a dangling observable — it drives the culture chill that
  // closes the R1 loop (AUDIT.md F1). The chill terms are computed here rather than
  // inside the derivative so they are observable: the causal-loop view scores loop
  // dominance from them, and they can be charted.
  const { U, R1, R2, R3, TD, L, E_pl, E_reg, E_fid, C } = s

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
  // v0.3.0: the Michaelis–Menten form had a POLE at TD = −TD_ref·td_sat, which RK4's
  // unclamped intermediate stages can reach from TD ≈ 0 at registry minima
  // (AUDIT.md F12). The bounded exponential below matches both the low-debt slope
  // (alpha_td/TD_ref) and the ceiling (1 + alpha_td·td_sat) and has no pole.
  const capabilityFactor = Math.max(0, 1 - p.beta_L * (L / 100))
  const debtRatio = TD / p.TD_ref
  const debtAmplification = 1 + p.alpha_td * p.td_sat * (1 - Math.exp(-debtRatio / p.td_sat))
  const incident_inflow = Math.max(0, p.base_incident_rate * debtAmplification * capabilityFactor)

  /**
   * Fraction of debt actually available to act on; → 0 as TD → 0.
   *
   * The `TD > 0` guard is load-bearing, not defensive. Without it the Michaelis
   * form returns a value ABOVE 1 for TD < −td_k (e.g. 1.37 at TD = −7.4), which
   * scales remediation *up* in a region where there is no debt to remediate — and
   * that admits a spurious negative-debt equilibrium. The v0.3.0 reliability gate
   * caught exactly that: the learning attractor was resolving at TD = −7.4.
   */
  const debtAvailability = TD > 0 ? TD / (TD + p.td_k) : 0

  const to_D = f_doc * incident_inflow
  const to_U = (1 - f_doc) * incident_inflow

  const translation_layer_efficiency =
    p.base_eff +
    p.tl_boost * p.translation_layer +
    p.intermediary_efficiency_boost * p.intermediary_capacity
  const near_miss_signal =
    p.near_miss_tier *
    incident_inflow *
    (NEAR_MISS_SIGNAL.base_share + NEAR_MISS_SIGNAL.separation_share * p.recipient_enforcer_separation)
  const challengeMultiplier = 1 + p.challenge_learning_boost * p.effective_challenge
  const learning_gain =
    p.eta_learn * to_D * translation_layer_efficiency * challengeMultiplier +
    p.near_miss_learning_boost * near_miss_signal * translation_layer_efficiency
  // v0.3.0: gated by debtAvailability. You cannot remediate debt that does not
  // exist, and without this gate dTD/dt < 0 at TD = 0, so the lower bound had to be
  // enforced by a clamp that fired on >83% of steps in the learning presets and
  // degraded RK4 to first order (AUDIT.md F2, F11).
  const remediation =
    p.rho * R3 * (L / 100) * (1 + p.challenge_remediation_boost * p.effective_challenge) * debtAvailability
  // Channel Three closes out its own work orders; the old `d_closeout` was the
  // closeout of the retired lumped `D` stock.
  const d_closeout = p.delta_R3 * R3

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
  const protectionBundle = clamp01(
    PROTECTION_BUNDLE.privilege_strength * p.privilege_strength +
      PROTECTION_BUNDLE.workflow_protection * p.workflow_protection +
      PROTECTION_BUNDLE.safe_harbor_non_admission * p.safe_harbor_non_admission +
      PROTECTION_BUNDLE.original_records_boundary * p.original_records_boundary +
      PROTECTION_BUNDLE.recipient_enforcer_separation * p.recipient_enforcer_separation,
  )
  // v0.3.0: phi_doc removed. It is declared `exposure/incident` and was being reused
  // as a dimensionless gain here, which is both a unit error and a hard parameter
  // alias — phi_doc could not be varied in dE/dt without moving the culture loop
  // (AUDIT.md F7). psi's default absorbs the old product; see the registry note.
  const backfire = p.psi * f_doc * (1 - protectionBundle)

  // --- v0.3.0 M3: tripwire and channel routing ---------------------------
  //
  // Severity is harm normalised onto 0-1 so the pre-committed threshold has a
  // scale-free quantity to compare against. The tripwire is what makes entry to
  // Channel Two a deliberate, preplanned legal step rather than a post-hoc one —
  // which is the whole basis of the paper's privilege argument.
  const severity = harm_events / (harm_events + p.sev_k)
  const trip = sigmoid(p.g_trip * (severity - p.tau_review))

  // Channel One is written REGARDLESS of legal posture: it is ordinary-course
  // telemetry, discoverable by design. Channel Two exists only when the tripwire
  // fires. Channel Three receives from Two (scaled by surviving privilege, since
  // leakage limits what can safely be transmitted) and, for routine fixes, from One.
  const to_R1 = to_D + belated_doc
  const to_R2 = trip * to_D * p.kappa_2
  const privilege_survival = clamp01(p.privilege_strength)
  const to_R3 = R2 * p.rate_23 * privilege_survival + R1 * p.rate_13

  // --- v0.3.0 M3: three opposing exposure gradients ----------------------
  //
  // This sign structure is the paper's core claim, and v0.2 could not express it:
  //   E_pl  RISES with candour   (discovery of the record; unprotected analysis)
  //   E_reg RISES with suppression (unmet Art. 73 duty; PLD Art. 9(1) presumption)
  //   E_fid RISES with suppression (Caremark: the board cannot see what was not written)
  const harm_rate = harm_events * p.rate_harm
  const board_visibility = R1 / (R1 + p.bv_k)

  const pl_from_records = p.c_rec_exp * R1 * p.disc_prob
  const pl_from_analysis = (1 - privilege_survival) * p.xi_2 * R2
  const pl_from_harm = p.c_harm_exp * harm_rate

  // Undocumented incidents are exactly the ones a reporting duty was not met on.
  const reg_from_duty = p.xi_duty * p.mandatory_reporting * to_U
  const reg_from_pld = p.xi_pld * p.pld_penalty * to_U
  const fid_from_blindness = p.xi_board * (1 - board_visibility) * harm_rate

  // The two return arrows of the R1 suppression spiral. Saturating so that
  // unbounded exposure or harm cannot drive the culture target arbitrarily negative.
  const E_tot = p.v_pl * E_pl + p.v_reg * E_reg + p.v_fid * E_fid
  const exposure_chill = p.psi_E * (E_tot / (E_tot + p.E_k))
  const harm_chill = p.psi_H * (harm_events / (harm_events + p.h_k))

  // The unweighted mean asserts that all seven private-ordering levers are equally
  // substitutable — a modelling choice, named in readouts.ts rather than buried.
  const privateOrderableCapacity = clamp01(
    PRIVATE_ORDERABLE_LEVERS.reduce((sum, k) => sum + p[k], 0) / PRIVATE_ORDERABLE_LEVERS.length,
  )
  const policy_scaffold_dependency = clamp01(
    POLICY_SCAFFOLD.safe_harbor_non_admission * p.safe_harbor_non_admission +
      POLICY_SCAFFOLD.workflow_protection * p.workflow_protection +
      POLICY_SCAFFOLD.privilege_strength * p.privilege_strength,
  )
  const private_ordering_gap = clamp01(
    policy_scaffold_dependency - PRIVATE_ORDERING.capacity_offset * privateOrderableCapacity,
  )
  const accountability_legitimacy = clamp01(
    ACCOUNTABILITY_LEGITIMACY.original_records_boundary * p.original_records_boundary +
      ACCOUNTABILITY_LEGITIMACY.just_culture * p.just_culture +
      ACCOUNTABILITY_LEGITIMACY.mandatory_reporting * p.mandatory_reporting +
      ACCOUNTABILITY_LEGITIMACY.effective_challenge * p.effective_challenge +
      ACCOUNTABILITY_LEGITIMACY.near_miss_tier * p.near_miss_tier,
  )
  const safe_to_report_score = clamp01(
    SAFE_TO_REPORT.privilege_strength * p.privilege_strength +
      SAFE_TO_REPORT.recipient_enforcer_separation * p.recipient_enforcer_separation +
      SAFE_TO_REPORT.workflow_protection * p.workflow_protection +
      SAFE_TO_REPORT.safe_harbor_non_admission * p.safe_harbor_non_admission +
      SAFE_TO_REPORT.original_records_boundary * p.original_records_boundary +
      SAFE_TO_REPORT.just_culture * p.just_culture +
      SAFE_TO_REPORT.intermediary_capacity * p.intermediary_capacity -
      SAFE_TO_REPORT.discoverability_penalty * softplus(perceived_discoverability, p.pd_sharpness),
  )
  const learning_yield = incident_inflow > 1e-9 ? learning_gain / incident_inflow : 0
  const litigation_pressure = clamp01(
    LITIGATION_PRESSURE.discoverability * softplus(perceived_discoverability, p.pd_sharpness) +
      LITIGATION_PRESSURE.pld_penalty * p.pld_penalty +
      LITIGATION_PRESSURE.mandatory_reporting * p.mandatory_reporting +
      LITIGATION_PRESSURE.unsafe_to_report * (1 - safe_to_report_score) +
      LITIGATION_PRESSURE.no_records_boundary * (1 - p.original_records_boundary),
  )

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
    exposure_chill,
    harm_chill,
    severity,
    trip,
    to_R1,
    to_R2,
    to_R3,
    privilege_survival,
    harm_rate,
    board_visibility,
    pl_from_records,
    pl_from_analysis,
    pl_from_harm,
    reg_from_duty,
    reg_from_pld,
    fid_from_blindness,
    E_tot,
    near_miss_signal,
    private_ordering_gap,
    accountability_legitimacy,
    safe_to_report_score,
    learning_yield,
    litigation_pressure,
    policy_scaffold_dependency,
  }
}

/**
 * The right-hand side of the ODE system: dState/dt (spec §2.3).
 * Pure; takes a pre-computed aux bundle to avoid recomputation in the integrator.
 */
export function derivativesFromAux(s: State, p: Params, a: Auxiliaries): State {
  const dU = a.to_U - a.belated_doc - a.u_to_debt

  // Three channels with distinct evidentiary status (ADR/0002).
  const dR1 = a.to_R1 - p.delta_R1 * s.R1
  const dR2 = a.to_R2 - p.delta_R2 * s.R2
  const dR3 = a.to_R3 - p.delta_R3 * s.R3

  const dTD = a.u_to_debt + p.td_baseline - a.remediation - p.delta_TD * s.TD
  const dL = a.learning_gain - p.delta_L * s.L

  // Opposing gradients (ADR/0003). Shared decay: exposure of every kind settles.
  const dE_pl = a.pl_from_records + a.pl_from_analysis + a.pl_from_harm - p.theta_E * s.E_pl
  const dE_reg = a.reg_from_duty + a.reg_from_pld - p.theta_E * s.E_reg
  const dE_fid = a.fid_from_blindness - p.theta_E * s.E_fid

  // --- Culture (v0.3.0: the R1 loop is now actually closed) ---------------------
  //
  // Before v0.3.0 every term here depended only on C and parameters, so dC/dt was
  // an AUTONOMOUS scalar equation and the debt → harm → exposure → culture loop
  // described in MODEL.md §7 did not exist in the code (AUDIT.md F1). The two
  // saturating terms below are the return arrows: realised exposure and realised
  // harm both chill the willingness to document. They make dC/dt depend on E, TD
  // and L, so the Jacobian's culture row is no longer [0,0,0,0,0,∂C].
  //
  // Both are saturating so that unbounded E or harm cannot drive the target
  // arbitrarily negative, and the target is clamped to [0,1] — the stock's own
  // range — so "target" means what the name says.
  const cultureTarget = clamp01(
    p.a_jc_c * p.just_culture +
      p.a_sep * p.recipient_enforcer_separation +
      a.safety_wins -
      a.backfire -
      a.exposure_chill -
      a.harm_chill,
  )

  // Kernel: a convex blend of a constant floor and the (normalised) logistic bump.
  // The pure C·(1−C) kernel makes C = 0 and C = 1 exact fixed points, so once the
  // clamp pinned culture at a boundary no policy change could ever move it again
  // (AUDIT.md F9). eps_C keeps the bistable shape while allowing recovery.
  const kernel = p.eps_C + (1 - p.eps_C) * 4 * s.C * (1 - s.C)
  const dC = p.lambda_C * (cultureTarget - s.C) * kernel

  return { U: dU, R1: dR1, R2: dR2, R3: dR3, TD: dTD, L: dL, E_pl: dE_pl, E_reg: dE_reg, E_fid: dE_fid, C: dC }
}

/** Convenience: derivatives with aux computed internally. */
export function derivatives(s: State, p: Params): State {
  return derivativesFromAux(s, p, computeAux(s, p))
}
