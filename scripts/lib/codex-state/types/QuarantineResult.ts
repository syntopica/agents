import type { QuarantineEntry } from './QuarantineEntry'

export interface QuarantineResult {
  status: 'blocked' | 'not-corrupt' | 'quarantined' | 'snapshot-invalid'
  entries: QuarantineEntry[]
  reasons: string[]
}
