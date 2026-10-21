import { resolveGuidanceProposalOutput } from './resolveGuidanceProposalOutput'
import type { GuidanceSyncOptions } from './types/GuidanceSyncOptions'

export const assertGuidanceProposalOutputUnchanged = async (
  options: GuidanceSyncOptions,
  expectedPath: string,
): Promise<void> => {
  if ((await resolveGuidanceProposalOutput(options)) !== expectedPath)
    throw new Error('proposal output destination changed during reconciliation')
}
