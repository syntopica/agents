import { resolveSkillPath } from './resolveSkillPath'
import { toLinkName } from './toLinkName'
import type { PlannedLink } from './types/PlannedLink'

export const planLinks = (
  skillsRoot: string,
  entryKeys: string[],
): PlannedLink[] =>
  entryKeys.map((entryKey) => ({
    name: toLinkName(entryKey),
    target: resolveSkillPath(skillsRoot, entryKey),
    entryKey,
    logicalName: entryKey,
  }))
