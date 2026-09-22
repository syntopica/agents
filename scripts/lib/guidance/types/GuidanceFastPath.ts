import type { ReconciliationResult } from './ReconciliationResult'

export type GuidanceFastPath =
  | { kind: 'reconcile' }
  | { kind: 'converged'; warning: string }
  | { kind: 'adopt'; result: ReconciliationResult }
