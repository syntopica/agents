import type { SkillSource } from './types/SkillSource'

export const hasReviewedSecurityExceptions = (source: SkillSource) =>
  (source.securityExceptions?.length ?? 0) > 0
