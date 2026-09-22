import { isFannedOut } from '../isFannedOut'
import type { CurationManifest } from '../types/CurationManifest'
import type { SkillAlias } from './types/SkillAlias'

export const resolveLaneSkill = (
  logicalName: string,
  target: string,
  manifest: CurationManifest,
  aliases: SkillAlias[],
): SkillAlias | undefined =>
  aliases.find((alias) => {
    if (alias.logicalName !== logicalName || alias.target !== target)
      return false
    const entry = manifest.entries[alias.curationKey]
    return entry !== undefined && isFannedOut(entry, target)
  })
