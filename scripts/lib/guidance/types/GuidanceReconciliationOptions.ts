import type { GuidancePolicy } from './GuidancePolicy'
import type { GuidanceSyncOptions } from './GuidanceSyncOptions'

export interface GuidanceReconciliationOptions {
  sync: GuidanceSyncOptions
  policy: GuidancePolicy
  policySha256: string
  runId: string
  snapshotDir: string
}
