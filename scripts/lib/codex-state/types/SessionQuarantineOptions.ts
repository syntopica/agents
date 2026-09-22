import type { SessionFinding } from './SessionFinding'

export interface SessionQuarantineOptions {
  codexDir: string
  snapshotDir: string
  findings: SessionFinding[]
  processTable?: string
}
