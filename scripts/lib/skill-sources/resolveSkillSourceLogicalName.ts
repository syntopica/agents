import type { SkillSource } from './types/SkillSource'

export const resolveSkillSourceLogicalName = (
  source: SkillSource,
  skill: string,
) => `${source.id}:${skill}`
