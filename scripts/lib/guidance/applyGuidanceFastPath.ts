import { applyGuidanceResult } from './applyGuidanceResult'
import type { ApplyGuidanceFastPathOptions } from './types/ApplyGuidanceFastPathOptions'
import type { GuidanceRunReport } from './types/GuidanceRunReport'

export const applyGuidanceFastPath = async (
  options: ApplyGuidanceFastPathOptions,
): Promise<GuidanceRunReport | undefined> => {
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
