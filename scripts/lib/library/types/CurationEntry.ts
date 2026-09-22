import type { CurationState } from './CurationState'

export interface CurationEntry {
  state: CurationState
  source?: string
  sourceUrl?: string
  skillPath?: string
  upstreamHash?: string
  licence?: string
  targets?: string[]
  aliases?: Record<string, string>
  triggers?: string[]
  patch?: string
  extractedInto?: string
  decidedAt?: string
  reason?: string
}
