import { promises as fs } from 'node:fs'
import { join, resolve, sep } from 'node:path'
import { isSkillCurationKey } from './isSkillCurationKey'
import { resolveSkillPath } from './resolveSkillPath'
import type { PruneParkedLinksInput } from './types/PruneParkedLinksInput'

/**
 * Removes the symlinks a parked entry left behind. A path is touched only when
 * it is a symlink whose target is the parked entry's library directory or sits
 * inside it, and is not a target this run is about to link; real files,
 * directories and links pointing anywhere else are never removed.
 */
export const pruneParkedLinks = async ({
  manifest,
  skillsRoot,
  linkDir,
  keep,
  dryRun,
}: PruneParkedLinksInput): Promise<string[]> => {
  const parked = Object.entries(manifest.entries)
    .filter(
      ([key, entry]) => isSkillCurationKey(key) && entry.state === 'parked',
    )
    .map(([key]) => resolve(resolveSkillPath(skillsRoot, key)))
  const kept = new Set(keep.map((path) => resolve(path)))
  const names = await fs.readdir(linkDir).catch(() => [] as string[])
  const removed: string[] = []

  for (const name of names) {
    const linkPath = join(linkDir, name)
    const stat = await fs.lstat(linkPath).catch(() => undefined)
    if (stat?.isSymbolicLink() !== true) continue

    const raw = await fs.readlink(linkPath)
    const target = resolve(linkDir, raw)
    const inParked = parked.some(
      (dir) => target === dir || target.startsWith(dir + sep),
    )
    if (!inParked || kept.has(target)) continue

    if (!dryRun) await fs.unlink(linkPath)
    removed.push(name)
  }

  return removed
}
