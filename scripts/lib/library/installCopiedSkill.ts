import { cp, mkdir, rm, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { pathExists } from '../link/operations/pathExists'
import type { LinkOutcome } from './types/LinkOutcome'
import type { PlannedLink } from './types/PlannedLink'

/**
 * Copies a compiled skill over a destination this tool owns. Ownership is read
 * from the destination itself: an absent path, or a directory that is already a
 * skill (it has a SKILL.md), is replaced; anything else is left alone and
 * reported, so a hand-written directory that happens to share a name is never
 * deleted.
 */
export const installCopiedSkill = async (
  link: PlannedLink,
  linkDir: string,
  dryRun: boolean,
): Promise<LinkOutcome> => {
  if (!(await pathExists(link.target))) {
    return {
      kind: 'missing',
      message: `${link.entryKey} has no directory at ${link.target}`,
    }
  }

  const destination = join(linkDir, link.name)
  const existing = await stat(destination).catch(() => undefined)
  if (existing !== undefined) {
    const owned =
      existing.isDirectory() &&
      (await pathExists(join(destination, 'SKILL.md')))
    if (!owned) {
      return {
        kind: 'foreign',
        message: `${link.name} exists and is not a skill directory this tool owns`,
      }
    }
  }

  if (!dryRun) {
    await mkdir(linkDir, { recursive: true })
    await rm(destination, { recursive: true, force: true })
    await cp(link.target, destination, { recursive: true })
  }

  return { kind: 'created' }
}
