import { lstat, realpath, stat } from 'node:fs/promises'
import { basename, dirname, isAbsolute, join, resolve } from 'node:path'
import { guidanceProposalContext } from './guidanceProposalContext'
import { pathContainsPath } from './pathContainsPath'
import type { GuidanceSyncOptions } from './types/GuidanceSyncOptions'

export const resolveGuidanceProposalOutput = async (
  options: GuidanceSyncOptions,
): Promise<string> => {
  if (
    options.proposalOutput === undefined ||
    !isAbsolute(options.proposalOutput)
  )
    throw new Error('proposal output must be an absolute path')
  const parent = await realpath(dirname(options.proposalOutput))
  const info = await stat(parent)
  if (
    !info.isDirectory() ||
    (info.mode & 0o077) !== 0 ||
    info.uid !== process.getuid?.()
  )
    throw new Error('proposal output parent must be an owner-private directory')
  const output = join(parent, basename(options.proposalOutput))
  for (const protectedRoot of [
    options.canonicalDir,
    options.stateDir,
    join(options.home, '.claude'),
    join(options.home, '.codex'),
  ]) {
    const target = await realpath(protectedRoot).catch((error: unknown) => {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT')
        return resolve(protectedRoot)
      throw error
    })
    if (pathContainsPath(target, output))
      throw new Error('proposal output overlaps protected guidance paths')
  }
  const inventory = guidanceProposalContext(options)['rulesInventoryPath']
  if (inventory === undefined)
    throw new Error('rules inventory path is missing')
  const inventoryParent = await realpath(dirname(inventory)).catch(
    (error: unknown) => {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT')
        return resolve(dirname(inventory))
      throw error
    },
  )
  if (output === join(inventoryParent, basename(inventory)))
    throw new Error('proposal output overlaps the rules inventory')
  try {
    await lstat(output)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return output
    throw error
  }
  throw new Error('proposal output already exists')
}
