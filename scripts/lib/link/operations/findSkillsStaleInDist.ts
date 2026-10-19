import path from 'node:path'
import { listSkillDirs } from '../../skills/loaders/listSkillDirs'
import { isCompiledSkillStale } from './isCompiledSkillStale'

/**
 * Source skills whose compiled copy in dist is out of date. Linking copies
 * dist, so a source edited (or pulled from the other machine) without a
 * compile would ship the old text everywhere while looking current. A
 * non-empty result means compile before linking.
 */
export const findSkillsStaleInDist = async (
  sourceRoots: string[],
  distDir: string,
): Promise<string[]> => {
  const stale: string[] = []
  for (const root of sourceRoots) {
    for (const dir of await listSkillDirs(root)) {
      const name = path.relative(root, dir)
      if (await isCompiledSkillStale(dir, path.join(distDir, name)))
        stale.push(name)
    }
  }
  return stale.sort((a, b) => a.localeCompare(b))
}
