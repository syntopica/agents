import type { DatabaseIntegrity } from './DatabaseIntegrity'
import type { SessionFinding } from './SessionFinding'

export interface CodexStateReport {
  codexDir: string
  databases: DatabaseIntegrity[]
  sessionCount: number
  sessionBytes: number
  malformedSessions: SessionFinding[]
}
