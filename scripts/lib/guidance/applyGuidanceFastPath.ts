import { applyGuidanceResult } from './applyGuidanceResult'
import type { GuidanceFastPath } from './types/GuidanceFastPath'
import type { GuidanceRunReport } from './types/GuidanceRunReport'
import type { GuidanceSyncOptions } from './types/GuidanceSyncOptions'

export const applyGuidanceFastPath = async (options: {
  fastPath: GuidanceFastPath
  sync: GuidanceSyncOptions
  runId: string
  snapshotDir: string
}): Promise<GuidanceRunReport | undefined> => {
  if (options.fastPath.kind === 'reconcile') return undefined
  if (options.fastPath.kind === 'converged')
    return {
      ok: true,
      applied: false,
      runId: options.runId,
      snapshotDir: options.snapshotDir,
      errors: [],
      warnings: [options.fastPath.warning],
    }
  if (options.sync.dryRun === true)
    return {
      ok: true,
      applied: false,
      runId: options.runId,
      snapshotDir: options.snapshotDir,
      errors: [],
      warnings: [
        ...options.fastPath.result.warnings,
        'dry run validated successfully; no guidance files or snapshots were written',
      ],
    }
  const acceptedSnapshotDir = await applyGuidanceResult({
    ...options.sync,
    runId: options.runId,
    result: options.fastPath.result,
  })
  return {
    ok: true,
    applied: true,
    runId: options.runId,
    snapshotDir: acceptedSnapshotDir,
    errors: [],
    warnings: options.fastPath.result.warnings,
  }
}
