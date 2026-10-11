import path from 'node:path'
import { listSkillDirs } from '../../skills/loaders/listSkillDirs'

/**
 * Source skills that the compiled dist does not contain. Linking prunes every
 * linked skill that dist lacks, so a dist compiled before a source skill was
 * added unlinks that skill: on 2026-10-11 a stale dist unlinked three instance
 * skills. A non-empty result means compile before linking.
 */
export const findSkillsMissingFromDist = async (
  sourceRoots: string[],
  distDir: string,
): Promise<string[]> => {
  const compiled = new Set(
    (await listSkillDirs(distDir)).map((dir) => path.relative(distDir, dir)),
  )
  const missing: string[] = []

  for (const root of sourceRoots) {
    for (const dir of await listSkillDirs(root)) {
      const name = path.relative(root, dir)
      if (!compiled.has(name)) missing.push(name)
    }
  }

  return missing.sort((a, b) => a.localeCompare(b))
}
