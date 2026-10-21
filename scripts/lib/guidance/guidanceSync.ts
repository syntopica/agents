import { mkdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { acquireGuidanceLock } from './acquireGuidanceLock'
import { createGuidanceRunId } from './createGuidanceRunId'
import { parseGuidancePolicy } from './parseGuidancePolicy'
import { removeCreatedGuidanceStateDir } from './removeCreatedGuidanceStateDir'
import { runGuidanceReconciliation } from './runGuidanceReconciliation'
import { sha256Text } from './sha256Text'
import { shouldRemoveGuidanceStateDir } from './shouldRemoveGuidanceStateDir'
import type { GuidanceRunReport } from './types/GuidanceRunReport'
import type { GuidanceSyncOptions } from './types/GuidanceSyncOptions'
import { validateGuidanceProposalOptions } from './validators/validateGuidanceProposalOptions'

export const guidanceSync = async (
  options: GuidanceSyncOptions,
): Promise<GuidanceRunReport> => {
  const runId = createGuidanceRunId()
  const lockPath = join(options.stateDir, 'lock')
  const snapshotDir = join(options.stateDir, 'runs', runId)
  const optionErrors = validateGuidanceProposalOptions(options)
  if (optionErrors.length > 0)
    return {
      ok: false,
      applied: false,
      runId,
      snapshotDir,
      errors: optionErrors,
      warnings: [],
    }
  const dryRun = options.dryRun === true || options.proposalOutput !== undefined
  let removeEmptyStateDir = false
  let parsedPolicy: ReturnType<typeof parseGuidancePolicy>
  let policySha256: string
  try {
    const policyText = await readFile(
      join(options.canonicalDir, 'policy.json'),
      'utf8',
    )
    policySha256 = sha256Text(policyText)
    parsedPolicy = parseGuidancePolicy(JSON.parse(policyText) as unknown)
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
      dryRun || options.applyProposal !== undefined,
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
    return await runGuidanceReconciliation({
      sync: options,
      policy: parsedPolicy.policy,
      policySha256,
      runId,
      snapshotDir,
    })
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
