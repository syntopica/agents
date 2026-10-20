import type { ReconciliationResult } from '../../types/ReconciliationResult'

export interface ValidateReconciliationResultSuccess {
  ok: true
  result: ReconciliationResult
}
