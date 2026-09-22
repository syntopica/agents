import type { Proposal } from '../learning/types/Proposal'

export const formatProposals = (proposals: Proposal[], asJson: boolean) => {
  if (asJson) {
    return JSON.stringify({ proposals }, null, 2)
  }

  if (proposals.length === 0) {
    return 'no proposals'
  }

  return proposals
    .map(
      (proposal) =>
        `${proposal.kind.padEnd(12)} ${String(proposal.requests).padStart(4)}  ${proposal.skill ?? proposal.procedure ?? ''}\n             ${proposal.why}`,
    )
    .join('\n')
}
