import type { SkillSourceSecurityException } from './SkillSourceSecurityException'

export interface SkillSource {
  id: string
  source: string
  resolvedCommit: string
  skills: string[]
  targets: string[]
  securityExceptions?: SkillSourceSecurityException[]
}
