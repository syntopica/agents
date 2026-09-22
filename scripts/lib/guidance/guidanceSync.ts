import { mkdir, readFile, realpath } from 'node:fs/promises'
import { join } from 'node:path'
import { acquireGuidanceLock } from './acquireGuidanceLock'
import { applyGuidanceFastPath } from './applyGuidanceFastPath'
import { applyGuidanceResult } from './applyGuidanceResult'
import { buildReconciliationPrompt } from './buildReconciliationPrompt'
import { collectGuidanceSources } from './collectGuidanceSources'
import { containsSensitiveGuidanceContent } from './containsSensitiveGuidanceContent'
import { createGuidanceRunId } from './createGuidanceRunId'
import { parseGuidancePolicy } from './parseGuidancePolicy'
import { removeCreatedGuidanceStateDir } from './removeCreatedGuidanceStateDir'
import { resolveGuidanceFastPath } from './resolveGuidanceFastPath'
import { runReconciliationAgent } from './runReconciliationAgent'
import { shouldRemoveGuidanceStateDir } from './shouldRemoveGuidanceStateDir'
import type { GuidanceRunReport } from './types/GuidanceRunReport'
import type { GuidanceSyncOptions } from './types/GuidanceSyncOptions'
import { validateReconciliationResult } from './validators/validateReconciliationResult'

export const guidanceSync = async (
  options: GuidanceSyncOptions,
): Promise<GuidanceRunReport> => {
  const runId = createGuidanceRunId()
  const lockPath = join(options.stateDir, 'lock')
  const snapshotDir = join(options.stateDir, 'runs', runId)
  let removeEmptyStateDir = false
  let parsedPolicy: ReturnType<typeof parseGuidancePolicy>
  try {
    parsedPolicy = parseGuidancePolicy(
      JSON.parse(
        await readFile(join(options.canonicalDir, 'policy.json'), 'utf8'),
      ) as unknown,
    )
  } catch {
    return {
      ok: false,
      applied: false,
      runId,
      snapshotDir,
      errors: ['policy.json is missing or invalid JSON'],
      warnings: [],
    }
  }
  if (!parsedPolicy.ok)
    return {
      ok: false,
      applied: false,
      runId,
      snapshotDir,
      errors: parsedPolicy.errors,
      warnings: [],
    }
  let releaseLock: (() => Promise<void>) | undefined
  try {
    removeEmptyStateDir = await shouldRemoveGuidanceStateDir(
      options.stateDir,
      options.dryRun === true,
    )
    await mkdir(options.stateDir, { recursive: true, mode: 0o700 })
    releaseLock = await acquireGuidanceLock(
      lockPath,
      runId,
      parsedPolicy.policy.timeoutMs + 30_000,
    )
  } catch (error) {
    await removeCreatedGuidanceStateDir(options.stateDir, removeEmptyStateDir)
    return {
      ok: false,
      applied: false,
      runId,
      snapshotDir,
      errors: [
        error instanceof Error
          ? error.message
          : 'could not acquire guidance lock',
      ],
      warnings: [],
    }
  }
  try {
    const sources = await collectGuidanceSources(options)
    if (containsSensitiveGuidanceContent(JSON.stringify(sources.values)))
      return {
        ok: false,
        applied: false,
        runId,
        snapshotDir,
        errors: [
          'guidance sources contain credential or captured conversation material',
        ],
        warnings: [],
      }
    const fastPath = resolveGuidanceFastPath({
      sources,
      policy: parsedPolicy.policy,
      acceptPublished: options.acceptPublished === true,
    })
    const fastPathReport = await applyGuidanceFastPath({
      fastPath,
      sync: options,
      runId,
      snapshotDir,
    })
    if (fastPathReport !== undefined) return fastPathReport
    const runStartedAt = new Date()
    const rawResult = await runReconciliationAgent(
      parsedPolicy.policy,
      buildReconciliationPrompt(parsedPolicy.policy, sources),
      await realpath(options.home),
    )
    const validated = validateReconciliationResult(
      rawResult,
      parsedPolicy.policy,
      sources.hashes,
      runStartedAt,
      new Date(),
    )
    if (!validated.ok)
      return {
        ok: false,
        applied: false,
        runId,
        snapshotDir,
        errors: validated.errors,
        warnings: [],
      }
    const currentSources = await collectGuidanceSources(options)
    if (
      JSON.stringify(
        Object.entries(currentSources.hashes).toSorted(([left], [right]) =>
          left.localeCompare(right),
        ),
      ) !==
      JSON.stringify(
        Object.entries(sources.hashes).toSorted(([left], [right]) =>
          left.localeCompare(right),
        ),
      )
    )
      return {
        ok: false,
        applied: false,
        runId,
        snapshotDir,
        errors: ['guidance sources changed during reconciliation'],
        warnings: [],
      }
    if (options.dryRun === true)
      return {
        ok: true,
        applied: false,
        runId,
        snapshotDir,
        errors: [],
        warnings: [
          ...validated.result.warnings,
          'dry run validated successfully; no guidance files or snapshots were written',
        ],
      }
    const acceptedSnapshotDir = await applyGuidanceResult({
      ...options,
      runId,
      result: validated.result,
    })
    return {
      ok: true,
      applied: true,
      runId,
      snapshotDir: acceptedSnapshotDir,
      errors: [],
      warnings: validated.result.warnings,
    }
  } catch (error) {
    return {
      ok: false,
      applied: false,
      runId,
      snapshotDir,
      errors: [
        error instanceof Error
          ? error.message
          : 'guidance reconciliation failed',
      ],
      warnings: [],
    }
  } finally {
    await releaseLock()
    await removeCreatedGuidanceStateDir(options.stateDir, removeEmptyStateDir)
  }
}
