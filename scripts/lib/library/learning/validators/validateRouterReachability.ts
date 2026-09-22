import { readCurationManifest } from '../../cli/readCurationManifest'
import type { SkillTarget } from '../../types/SkillTarget'
import { LANE_SKILLS } from '../constants/LANE_SKILLS'
import { loadSkillAliases } from '../loadSkillAliases'
import { validateLaneSkills } from './validateLaneSkills'

export const validateRouterReachability = async (
  libraryDir: string,
  target: SkillTarget,
): Promise<string[]> => {
  const parsed = await readCurationManifest(libraryDir)
  if (!parsed.ok) return parsed.errors
  const aliases = await loadSkillAliases(libraryDir, target, parsed.manifest)
  return validateLaneSkills(LANE_SKILLS, target, parsed.manifest, aliases)
}
