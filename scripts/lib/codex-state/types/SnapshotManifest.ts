import type { SnapshotManifestEntry } from './SnapshotManifestEntry'

export interface SnapshotManifest {
  version: 1
  createdAt: string
  entries: SnapshotManifestEntry[]
}
