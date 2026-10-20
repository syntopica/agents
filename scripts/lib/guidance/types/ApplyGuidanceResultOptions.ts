import type { ReconciliationResult } from './ReconciliationResult'

export interface ApplyGuidanceResultOptions {
  home: string
  canonicalDir: string
  stateDir: string
  runId: string
  result: ReconciliationResult
}
