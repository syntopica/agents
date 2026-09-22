import type { DescriptionProposal } from './types/DescriptionProposal'

export const proposeDescriptionEdit = (
  skill: string,
  description: string,
  triggers: string[],
  covered: (phrase: string, description: string) => boolean,
): DescriptionProposal | undefined => {
  const uncovered = triggers.filter((phrase) => !covered(phrase, description))

  if (uncovered.length === 0) {
    return undefined
  }

  return { skill, description, uncovered }
}
