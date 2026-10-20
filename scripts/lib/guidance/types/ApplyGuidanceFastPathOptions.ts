import type { GuidanceFastPath } from './GuidanceFastPath'
import type { GuidanceSyncOptions } from './GuidanceSyncOptions'

export interface ApplyGuidanceFastPathOptions {
  fastPath: GuidanceFastPath
  sync: GuidanceSyncOptions
  runId: string
  snapshotDir: string
}
