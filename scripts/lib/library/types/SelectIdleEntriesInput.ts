import type { CurationManifest } from './CurationManifest'

export interface SelectIdleEntriesInput {
  manifest: CurationManifest
  invocations: Record<string, number>
  target: string
  authoredSource: string
  today: string
  idleDays: number
}
