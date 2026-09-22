import type { DescriptionProposal } from '../types/DescriptionProposal'

export const formatDescriptionProposals = (
  proposals: DescriptionProposal[],
) => {
  if (proposals.length === 0) {
    return 'every measured trigger is already reflected in its description'
  }

  return proposals
    .map((proposal) =>
      [
        `${proposal.skill}: ${String(proposal.uncovered.length)} measured phrase(s) the description does not reflect`,
        ...proposal.uncovered.map((phrase) => `    ${phrase.slice(0, 100)}`),
      ].join('\n'),
    )
    .join('\n\n')
}
