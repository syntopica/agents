import { access } from 'node:fs/promises'
import { join } from 'node:path'
import { buildSkillKeyIndex } from '../buildSkillKeyIndex'
import { listSkillPaths } from '../cli/listSkillPaths'
import { isFannedOut } from '../isFannedOut'
import { resolveTargetSkillName } from '../resolveTargetSkillName'
import type { CurationManifest } from '../types/CurationManifest'
import type { SkillTarget } from '../types/SkillTarget'
import type { SkillAlias } from './types/SkillAlias'

export const loadSkillAliases = async (
  libraryDir: string,
  target: SkillTarget,
  manifest: CurationManifest,
): Promise<SkillAlias[]> => {
  const paths = await listSkillPaths(libraryDir)
  const index = buildSkillKeyIndex(Object.keys(manifest.entries), paths)
  const aliases: SkillAlias[] = []
  for (const path of paths) {
    const leaf = path.split('/').at(-1)
    if (leaf === undefined) continue
    const curationKey = index[leaf]
    if (curationKey === undefined) continue
    const entry = manifest.entries[curationKey]
    if (entry === undefined || !isFannedOut(entry, target)) continue
    const logicalName = path.includes(':') ? path : leaf
    const targetName =
      entry.aliases?.[target] ?? resolveTargetSkillName(path, target)
    const compiledPath = join(
      libraryDir,
      'compiled',
      target,
      'skills',
      targetName,
      'SKILL.md',
    )
    const exists = await access(compiledPath)
      .then(() => true)
      .catch(() => false)
    if (exists) aliases.push({ logicalName, curationKey, target, targetName })
  }
  return aliases
}
