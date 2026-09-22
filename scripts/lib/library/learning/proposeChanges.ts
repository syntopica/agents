import { selectFannedOutSkills } from '../selectors/selectFannedOutSkills'
import { proposeForProcedure } from './proposeForProcedure'
import { proposeIdleParking } from './proposeIdleParking'
import { remapInvocations } from './remapInvocations'
import type { Proposal } from './types/Proposal'
import type { ProposeChangesInput } from './types/ProposeChangesInput'

export const proposeChanges = ({
  procedures,
  manifest,
  invocations,
  target,
  keyIndex,
}: ProposeChangesInput): Proposal[] => {
  const fannedOut = selectFannedOutSkills(manifest, target)
  const counts = remapInvocations(invocations, keyIndex)
  const proposals: Proposal[] = []

  for (const procedure of procedures) {
    const resolved =
      procedure.covers === undefined
        ? procedure
        : {
            ...procedure,
            covers: keyIndex[procedure.covers] ?? procedure.covers,
          }
    const proposal = proposeForProcedure(resolved, manifest, fannedOut, counts)
    if (proposal !== undefined) {
      proposals.push(proposal)
    }
  }

  proposals.push(...proposeIdleParking(fannedOut, procedures, counts))

  return proposals.toSorted((left, right) => right.requests - left.requests)
}
