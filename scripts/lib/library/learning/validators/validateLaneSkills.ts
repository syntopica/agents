import type { CurationManifest } from '../../types/CurationManifest'
import { resolveLaneSkill } from '../resolveLaneSkill'
import type { SkillAlias } from '../types/SkillAlias'

export const validateLaneSkills = (
  lanes: Record<string, readonly string[] | 'policy-only'>,
  target: string,
  manifest: CurationManifest,
  aliases: SkillAlias[],
): string[] => {
  const errors: string[] = []
  for (const [lane, skills] of Object.entries(lanes)) {
    if (skills === 'policy-only') continue
    if (skills.length === 0) {
      errors.push(`${lane}: lane must declare a skill or policy-only ownership`)
      continue
    }
    for (const skill of skills) {
      if (resolveLaneSkill(skill, target, manifest, aliases) === undefined) {
        errors.push(`${lane}: ${skill} is unreachable for ${target}`)
      }
    }
  }
  return errors
}
