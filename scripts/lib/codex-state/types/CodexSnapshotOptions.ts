export interface CodexSnapshotOptions {
  codexDir: string
  backupsDir: string
  runId: string
  databaseNames?: readonly string[]
  onFileCopied?: (sourcePath: string) => Promise<void>
}
