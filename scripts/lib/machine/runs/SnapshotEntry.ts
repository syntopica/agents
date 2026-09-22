export interface SnapshotEntry {
  encoded: string
  path: string
  existed: boolean
  kind?: 'file' | 'directory' | 'symlink'
}
