export interface CreateGuidanceSnapshotEntries {
  key: string
  target: string
  existed: boolean
  storage: string
  sha256?: string
  mode?: number
}
