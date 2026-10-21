import { applyGuidanceResult } from './applyGuidanceResult'
import { assertGuidanceInputsUnchanged } from './assertGuidanceInputsUnchanged'
import { readGuidanceProposal } from './readGuidanceProposal'
import type { ApplyGuidanceProposalOptions } from './types/ApplyGuidanceProposalOptions'
import type { GuidanceRunReport } from './types/GuidanceRunReport'

export const applyGuidanceProposal = async (
  options: ApplyGuidanceProposalOptions,
): Promise<GuidanceRunReport> => {
  const proposal = await readGuidanceProposal(options)
  await assertGuidanceInputsUnchanged(
    options.sync,
    options.inputHashes,
    options.policySha256,
  )
  const snapshotDir = await applyGuidanceResult({
    ...options.sync,
    runId: options.runId,
    result: proposal.result,
  })
  return {
    ok: true,
    applied: true,
    runId: options.runId,
    snapshotDir,
    errors: [],
    warnings: [
      'reviewed proposal applied without running the reconciliation agent',
    ],
  }
}
