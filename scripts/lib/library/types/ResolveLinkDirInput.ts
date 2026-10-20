import type { SkillTarget } from './SkillTarget'

export interface ResolveLinkDirInput {
  into: string | undefined
  target: SkillTarget
  home: string
}
