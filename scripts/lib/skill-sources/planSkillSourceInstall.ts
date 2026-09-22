import type { SkillSource } from './types/SkillSource'

export const planSkillSourceInstall = (source: SkillSource): string[] => [
  'install',
  source.source,
  `--skills=${source.skills.join(',')}`,
  '--global',
  '--yes',
  '--scan',
  '--json',
]
