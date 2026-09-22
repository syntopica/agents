export interface InstalledPlugin {
  id: string
  scope: string
  version: string
  installPath: string
  gitCommitSha?: string
}
