import { constants } from 'node:fs'
import { open } from 'node:fs/promises'
import { guidanceProposalByteLimit } from './guidanceProposalByteLimit'
import { guidanceProposalContext } from './guidanceProposalContext'
import { isRecord } from './isRecord'
import { readBoundedGuidanceProposal } from './readBoundedGuidanceProposal'
import { sha256Text } from './sha256Text'
import type { ApplyGuidanceProposalOptions } from './types/ApplyGuidanceProposalOptions'
import type { GuidanceProposal } from './types/GuidanceProposal'
import { validateReconciliationResult } from './validators/validateReconciliationResult'

export const readGuidanceProposal = async (
  options: ApplyGuidanceProposalOptions,
): Promise<GuidanceProposal> => {
  const handle = await open(
    options.sync.applyProposal ?? '',
    constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK,
  )
  let text: string
  try {
    const info = await handle.stat()
    if (
      !info.isFile() ||
      info.uid !== process.getuid?.() ||
      (info.mode & 0o077) !== 0 ||
      info.size > guidanceProposalByteLimit(options.policy.maxOutputBytes)
    )
      throw new Error(
        'proposal must be a private regular file within the size limit',
      )
    text = await readBoundedGuidanceProposal(
      handle,
      guidanceProposalByteLimit(options.policy.maxOutputBytes),
    )
  } finally {
    await handle.close()
  }
  if (sha256Text(text) !== options.sync.proposalSha256)
    throw new Error('proposal SHA256 does not match reviewed bytes')
  let raw: unknown
  try {
    raw = JSON.parse(text) as unknown
  } catch {
    throw new Error('proposal is not valid JSON')
  }
  if (
    !isRecord(raw) ||
    Object.keys(raw).some(
      (key) =>
        ![
          'version',
          'startedAt',
          'endedAt',
          'policySha256',
          'context',
          'result',
        ].includes(key),
    ) ||
    raw['version'] !== 1 ||
    typeof raw['startedAt'] !== 'string' ||
    typeof raw['endedAt'] !== 'string'
  )
    throw new Error('proposal envelope is invalid')
  const startedAt = new Date(raw['startedAt'])
  const endedAt = new Date(raw['endedAt'])
  const now = Date.now()
  if (
    !Number.isFinite(startedAt.getTime()) ||
    !Number.isFinite(endedAt.getTime()) ||
    startedAt > endedAt ||
    endedAt.getTime() > now ||
    now - startedAt.getTime() > 86_400_000
  )
    throw new Error('proposal generation window is stale or invalid')
  if (raw['policySha256'] !== options.policySha256)
    throw new Error('proposal policy no longer matches')
  if (
    JSON.stringify(raw['context']) !==
    JSON.stringify(guidanceProposalContext(options.sync))
  )
    throw new Error('proposal targets no longer match')
  const validated = validateReconciliationResult(
    raw['result'],
    options.policy,
    options.inputHashes,
    startedAt,
    endedAt,
  )
  if (!validated.ok)
    throw new Error(
      `proposal validation failed: ${validated.errors.join('; ')}`,
    )
  return {
    version: 1,
    startedAt: raw['startedAt'],
    endedAt: raw['endedAt'],
    policySha256: options.policySha256,
    context: guidanceProposalContext(options.sync),
    result: validated.result,
  }
}
