import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import type { LinkOutcome } from './types/LinkOutcome'
import type { PlannedLink } from './types/PlannedLink'

export const installLink = async (
  link: PlannedLink,
  linkDir: string,
  dryRun: boolean,
): Promise<LinkOutcome> => {
  const exists = await fs
    .access(link.target)
    .then(() => true)
    .catch(() => false)

  if (!exists) {
    return {
      kind: 'missing',
      message: `${link.entryKey} has no directory at ${link.target}`,
    }
  }

  const linkPath = join(linkDir, link.name)
  const current = await fs.readlink(linkPath).catch(() => undefined)

  if (current === link.target) {
    return { kind: 'unchanged' }
  }

  if (current === undefined) {
    const occupied = await fs
      .lstat(linkPath)
      .then(() => true)
      .catch(() => false)

    if (occupied) {
      return {
        kind: 'foreign',
        message: `${link.name} exists and is not a symlink this tool owns`,
      }
    }
  }

  if (!dryRun) {
    await fs.mkdir(linkDir, { recursive: true })
    await fs.rm(linkPath, { force: true })
    await fs.symlink(link.target, linkPath)
  }

  return { kind: 'created' }
}
