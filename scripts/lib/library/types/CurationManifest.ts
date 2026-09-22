import type { CurationEntry } from './CurationEntry'

export interface CurationManifest {
  version: number
  entries: Record<string, CurationEntry>
}
