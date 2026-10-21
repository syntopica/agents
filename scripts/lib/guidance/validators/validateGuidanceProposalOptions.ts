import type { GuidanceSyncOptions } from '../types/GuidanceSyncOptions'

export const validateGuidanceProposalOptions = (
  options: GuidanceSyncOptions,
): string[] => {
  if (options.proposalOutput !== undefined) {
    if (
      options.applyProposal !== undefined ||
      options.proposalSha256 !== undefined ||
      options.acceptPublished === true
    )
      return [
        'proposal output cannot be combined with apply, hash, or accept-published',
      ]
    if (options.proposalOutput.trim() === '')
      return ['proposal output path must not be empty']
  }
  if (options.applyProposal !== undefined) {
    if (options.dryRun === true || options.acceptPublished === true)
      return [
        'applying a proposal cannot be combined with dry-run or accept-published',
      ]
    if (
      options.applyProposal.trim() === '' ||
      !/^[a-f0-9]{64}$/u.test(options.proposalSha256 ?? '')
    )
      return ['applying a proposal requires a path and exact lowercase SHA256']
  } else if (options.proposalSha256 !== undefined) {
    return ['proposal-sha256 requires apply-proposal']
  }
  return []
}
