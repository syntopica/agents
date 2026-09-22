import { join } from 'node:path'
import { guidanceTargets } from './guidanceTargets'
import { listGuidanceRuns } from './listGuidanceRuns'
import { restoreGuidanceSnapshot } from './restoreGuidanceSnapshot'
import type { GuidanceRunReport } from './types/GuidanceRunReport'

export const guidanceRollback = async (options: {
  home: string
  canonicalDir: string
  stateDir: string
  runId?: string
}): Promise<GuidanceRunReport> => {
  const runs = await listGuidanceRuns(join(options.stateDir, 'runs'))
  const runId = options.runId ?? runs.at(-1) ?? 'rollback'
  const snapshotDir = join(options.stateDir, 'runs', runId)
  if (!runs.includes(runId))
    return {
      ok: false,
      applied: false,
      runId,
      snapshotDir,
      errors: ['no complete guidance run is available for rollback'],
      warnings: [],
    }
  try {
    await restoreGuidanceSnapshot(snapshotDir, guidanceTargets(options))
    return {
      ok: true,
      applied: true,
      runId,
      snapshotDir,
      errors: [],
      warnings: [],
    }
  } catch (error) {
    return {
      ok: false,
      applied: false,
      runId,
      snapshotDir,
      errors: [
        error instanceof Error ? error.message : 'guidance rollback failed',
      ],
      warnings: [],
    }
  }
}
