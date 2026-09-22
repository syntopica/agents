import type { QuarantineEntry } from './QuarantineEntry'

export interface QuarantineRestoreResult {
  status: 'planned' | 'restored' | 'blocked' | 'collision' | 'invalid'
  entries: QuarantineEntry[]
  reasons: string[]
}
