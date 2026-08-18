/**
 * Shareable-URL codec (spec §5.6). A whole scenario is compressed into the URL
 * hash with lz-string so a link is self-contained — no backend. Params are encoded
 * as a *positional array* over `ALL_PARAM_KEYS` (not an object) to roughly halve
 * the payload; the engine exports a canonical, order-stable key list, so this is
 * safe across reloads. Decoding is defensive: any malformed input returns null, and
 * params always pass `sanitizeParams` so a hand-edited hash can never inject an
 * out-of-range value.
 */
import LZString from 'lz-string'
import {
  ALL_PARAM_KEYS,
  MODEL_VERSION,
  sanitizeParams,
  defaultParams,
  defaultInitState,
  sanitizeSettings,
} from '../engine'
import type { Scenario, Params, State, SimSettings, ParamKey } from '../engine'

const HASH_PREFIX = 's='

interface ShareCodecV1 {
  v: 1
  mv: string
  n: string
  /** optional key list for v0.2+; absent hashes decode using LEGACY_PARAM_KEYS_V1 */
  k?: string[]
  /** params positional over ALL_PARAM_KEYS */
  p: number[]
  i: State
  s: SimSettings
  pid: string | null
  a?: string
}

/**
 * Positional key order for v1 share hashes. Kept as plain strings, not ParamKey[],
 * because retired parameters must keep their historical SLOTS: `privilege_strength`
 * went in v0.3.0 M3b and `w_tl` in M3c, and an old link still carries a value at each
 * position. The decoder consumes every slot by index and discards values whose key is
 * no longer in the registry, so a retired name costs nothing but removing it would
 * shift every later parameter by one and silently corrupt existing links.
 *
 * THIS LIST IS A HISTORICAL RECORD, NOT A REGISTRY VIEW. Append only. `w_workflow` and
 * `w_safe` are absent because they postdate v0.1 — adding them "for completeness" is
 * exactly the mistake that breaks old links.
 */
const LEGACY_PARAM_KEYS_V1: string[] = [
  'privilege_strength',
  'just_culture',
  'mandatory_reporting',
  'pld_penalty',
  'recipient_enforcer_separation',
  'translation_layer',
  'gain',
  'threshold',
  'a_c',
  'a_jc',
  'a_m',
  'a_disc',
  'w_m',
  'w_p',
  'w_priv',
  'w_sep',
  'w_tl',
  'base_incident_rate',
  'alpha_td',
  'TD_ref',
  'td_sat',
  'beta_L',
  'eta_learn',
  'base_eff',
  'tl_boost',
  'delta_L',
  'rho',
  'kappa_D',
  'mu',
  'sigma',
  'td_baseline',
  'delta_TD',
  'gamma',
  'phi_doc',
  'phi_harm',
  'phi_pld',
  'theta_E',
  'omega',
  'psi',
  'lambda_C',
  'a_sep',
  'a_jc_c',
]

export function encodeScenarioToHash(sc: Scenario): string {
  const payload: ShareCodecV1 = {
    v: 1,
    mv: MODEL_VERSION,
    n: sc.name,
    k: [...ALL_PARAM_KEYS],
    p: ALL_PARAM_KEYS.map((k) => sc.params[k]),
    i: sc.init,
    s: sc.settings,
    pid: sc.presetId,
    a: sc.annotations || undefined,
  }
  const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(payload))
  return `#${HASH_PREFIX}${compressed}`
}

function extractToken(hash: string): string | null {
  const h = hash.startsWith('#') ? hash.slice(1) : hash
  if (!h) return null
  for (const part of h.split('&')) {
    if (part.startsWith(HASH_PREFIX)) return part.slice(HASH_PREFIX.length)
  }
  return null
}

export function decodeScenarioFromHash(hash: string): Scenario | null {
  try {
    const token = extractToken(hash)
    if (!token) return null
    const json = LZString.decompressFromEncodedURIComponent(token)
    if (!json) return null
    const data = JSON.parse(json) as Partial<ShareCodecV1>
    if (data.v !== 1 || !Array.isArray(data.p)) return null

    // Rebuild a full param object from the positional array, then sanitize.
    const raw: Partial<Params> = {}
    const keyOrder = Array.isArray(data.k) ? data.k.filter((k): k is ParamKey => (ALL_PARAM_KEYS as readonly string[]).includes(k)) : LEGACY_PARAM_KEYS_V1
    keyOrder.forEach((k, idx) => {
      const val = data.p![idx]
      if (typeof val === 'number' && Number.isFinite(val)) raw[k as ParamKey] = val
    })
    const params: Params = sanitizeParams({ ...defaultParams(), ...raw })
    const init: State = { ...defaultInitState(), ...(data.i ?? {}) }
    // Untrusted input: a share link can carry any settings at all. Sanitised rather
    // than spread, because the engine now refuses an impossible horizon/dt (V5.4) and a
    // corrupt link must degrade to a clamped scenario, not an exception on load.
    const settings: SimSettings = sanitizeSettings(data.s)

    return {
      id: 'shared',
      name: typeof data.n === 'string' ? data.n : 'Shared scenario',
      description: '',
      presetId: typeof data.pid === 'string' ? data.pid : null,
      params,
      init,
      settings,
      annotations: typeof data.a === 'string' ? data.a : '',
      createdAt: null,
      updatedAt: null,
    }
  } catch {
    return null
  }
}
