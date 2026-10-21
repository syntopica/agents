import { constants } from 'node:fs'
import { open } from 'node:fs/promises'
import { guidanceProposalByteLimit } from './guidanceProposalByteLimit'
import { sha256Text } from './sha256Text'
import type { GuidanceProposal } from './types/GuidanceProposal'
import type { GuidanceProposalReport } from './types/GuidanceProposalReport'

export const writeGuidanceProposal = async (
  path: string,
  proposal: GuidanceProposal,
  maxOutputBytes: number,
): Promise<GuidanceProposalReport> => {
  const text = `${JSON.stringify(proposal, null, 2)}\n`
  if (
    Buffer.byteLength(text, 'utf8') > guidanceProposalByteLimit(maxOutputBytes)
  )
    throw new Error('proposal exceeds the serialized byte limit')
  const handle = await open(
    path,
    constants.O_CREAT |
      constants.O_EXCL |
      constants.O_WRONLY |
      constants.O_NOFOLLOW,
    0o600,
  )
  try {
    await handle.writeFile(text, 'utf8')
    await handle.sync()
  } finally {
    await handle.close()
  }
  return { path, sha256: sha256Text(text) }
}
