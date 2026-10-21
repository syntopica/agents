import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { collectGuidanceSources } from './collectGuidanceSources'
import { sha256Text } from './sha256Text'
import { toGuidanceInputHashes } from './toGuidanceInputHashes'
import type { GuidanceSyncOptions } from './types/GuidanceSyncOptions'

export const assertGuidanceInputsUnchanged = async (
  options: GuidanceSyncOptions,
  hashes: Record<string, string>,
  policySha256: string,
): Promise<void> => {
  const current = await collectGuidanceSources(options)
  const currentPolicy = await readFile(
    join(options.canonicalDir, 'policy.json'),
    'utf8',
  )
  if (
    JSON.stringify(toGuidanceInputHashes(current.hashes)) !==
    JSON.stringify(toGuidanceInputHashes(hashes))
  )
    throw new Error('guidance sources changed during reconciliation')
  if (sha256Text(currentPolicy) !== policySha256)
    throw new Error('guidance policy changed during reconciliation')
}
