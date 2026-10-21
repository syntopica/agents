import { realpath } from 'node:fs/promises'
import { applyGuidanceFastPath } from './applyGuidanceFastPath'
import { applyGuidanceProposal } from './applyGuidanceProposal'
import { applyGuidanceResult } from './applyGuidanceResult'
import { assertGuidanceInputsUnchanged } from './assertGuidanceInputsUnchanged'
import { assertGuidanceProposalOutputUnchanged } from './assertGuidanceProposalOutputUnchanged'
import { buildReconciliationPrompt } from './buildReconciliationPrompt'
import { collectGuidanceSources } from './collectGuidanceSources'
import { containsSensitiveGuidanceContent } from './containsSensitiveGuidanceContent'
import { guidanceProposalContext } from './guidanceProposalContext'
import { resolveGuidanceFastPath } from './resolveGuidanceFastPath'
import { resolveGuidanceProposalOutput } from './resolveGuidanceProposalOutput'
import { runReconciliationAgent } from './runReconciliationAgent'
import type { GuidanceReconciliationOptions } from './types/GuidanceReconciliationOptions'
import type { GuidanceRunReport } from './types/GuidanceRunReport'
import { validateReconciliationResult } from './validators/validateReconciliationResult'
import { writeGuidanceProposal } from './writeGuidanceProposal'

export const runGuidanceReconciliation = async (
  input: GuidanceReconciliationOptions,
): Promise<GuidanceRunReport> => {
  const { sync: options, policy, policySha256, runId, snapshotDir } = input
  const dryRun = options.dryRun === true || options.proposalOutput !== undefined
  const proposalOutput =
    options.proposalOutput === undefined
      ? undefined
      : await resolveGuidanceProposalOutput(options)
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
  if (options.applyProposal !== undefined)
    return await applyGuidanceProposal({
      sync: options,
      policy,
      policySha256,
      inputHashes: sources.hashes,
      runId,
      snapshotDir,
    })
  const fastPath = resolveGuidanceFastPath({
    sources,
    policy,
    acceptPublished: options.acceptPublished === true,
  })
  const fastPathReport =
    proposalOutput === undefined
      ? await applyGuidanceFastPath({
          fastPath,
          sync: options,
          runId,
          snapshotDir,
        })
      : undefined
  if (fastPathReport !== undefined) return fastPathReport
  const runStartedAt = new Date()
  const rawResult = await runReconciliationAgent(
    policy,
    buildReconciliationPrompt(policy, sources),
    await realpath(options.home),
  )
  const runEndedAt = new Date()
  const validated = validateReconciliationResult(
    rawResult,
    policy,
    sources.hashes,
    runStartedAt,
    runEndedAt,
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
  await assertGuidanceInputsUnchanged(options, sources.hashes, policySha256)
  if (proposalOutput !== undefined)
    await assertGuidanceProposalOutputUnchanged(options, proposalOutput)
  const proposal =
    proposalOutput === undefined
      ? undefined
      : await writeGuidanceProposal(
          proposalOutput,
          {
            version: 1,
            startedAt: runStartedAt.toISOString(),
            endedAt: runEndedAt.toISOString(),
            policySha256,
            context: guidanceProposalContext(options),
            result: validated.result,
          },
          policy.maxOutputBytes,
        )
  if (dryRun)
    return {
      ok: true,
      applied: false,
      runId,
      snapshotDir,
      errors: [],
      warnings:
        proposal === undefined
          ? [
              ...validated.result.warnings,
              'dry run validated successfully; no guidance files or snapshots were written',
            ]
          : [
              'proposal saved for review; no guidance files or snapshots were written',
            ],
      ...(proposal === undefined ? {} : { proposal }),
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
}
