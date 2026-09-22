import type { ArchivePlanEntry } from './ArchivePlanEntry'

export interface ArchivePlan {
  sessionsDir: string
  entries: ArchivePlanEntry[]
  totalBytes: number
  skippedMalformed: string[]
}
