import { hasReviewedSecurityExceptions } from './hasReviewedSecurityExceptions'
import { planSkillSourceInstall } from './planSkillSourceInstall'
import type { SkillSource } from './types/SkillSource'

export const planSkillSourceApply = (source: SkillSource): string[] => [
  ...planSkillSourceInstall(source),
  ...(hasReviewedSecurityExceptions(source) ? ['--force'] : []),
]
