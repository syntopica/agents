import { isFannedOut } from '../isFannedOut'
import { isSkillCurationKey } from '../isSkillCurationKey'
import type { CurationManifest } from '../types/CurationManifest'

export const selectFannedOutSkills = (
  manifest: CurationManifest,
  target: string,
) =>
  Object.entries(manifest.entries)
    .filter(
      ([entryKey, entry]) =>
        isSkillCurationKey(entryKey) && isFannedOut(entry, target),
    )
    .map(([name]) => name)
