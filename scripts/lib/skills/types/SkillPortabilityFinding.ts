import type { SkillPortabilityKind } from './SkillPortabilityKind'

export interface SkillPortabilityFinding {
  path: string
  name?: string
  kind: SkillPortabilityKind
  fields: string[]
  reasons: string[]
}
