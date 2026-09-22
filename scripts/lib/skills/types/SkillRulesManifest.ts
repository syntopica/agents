import type { SkillEntry } from './SkillEntry'

export interface SkillRulesManifest {
  version: number
  skills: Record<string, SkillEntry>
}
