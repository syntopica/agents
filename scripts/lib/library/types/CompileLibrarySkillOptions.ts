import type { SkillTarget } from './SkillTarget'

export interface CompileLibrarySkillOptions {
  logicalName: string
  sourcePath: string
  outputRoot: string
  target: SkillTarget
}
