import type { SessionArchiveManifestEntry } from './SessionArchiveManifestEntry'

export interface SessionArchiveResult {
  status:
    'planned' | 'archived' | 'restored' | 'blocked' | 'collision' | 'invalid'
  runDir: string
  entries: SessionArchiveManifestEntry[]
  reasons: string[]
}
