import type { ReconciliationResult } from './ReconciliationResult'

export interface GuidanceProposal {
  version: 1
  startedAt: string
  endedAt: string
  policySha256: string
  context: Record<string, string>
  result: ReconciliationResult
}
