export interface GuidanceRunReport {
  ok: boolean
  applied: boolean
  runId: string
  snapshotDir: string
  errors: string[]
  warnings: string[]
}
