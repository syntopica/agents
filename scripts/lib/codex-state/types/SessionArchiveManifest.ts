import type { SessionArchiveManifestEntry } from './SessionArchiveManifestEntry'

export interface SessionArchiveManifest {
  version: 1
  createdAt: string
  entries: SessionArchiveManifestEntry[]
}
