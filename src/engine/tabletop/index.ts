/** Public contract of the pure Tabletop engine layer. Import from here. */
export * from './types'
export { tieStrengthFactor, translationLoss, normalizationProbability, crossBoundary, type CrossOpts } from './boundary'
export { recordCapturability, type CapturabilityOpts } from './capturability'
export { institutionalMeters, runConfig } from './meters'
export { applyChoice, type RunState } from './applyChoice'
export { engineForwardOutcome, type AftermathOutcome } from './outcome'
export { nodeById, resolveNext, reachableNodeIds, findUnreachable, enumeratePaths } from './resolver'
export { initialRunState, playPath, scorePath, scoreAllPaths, hasDominantPath, perceivedLegalShield, type PathScore } from './score'
