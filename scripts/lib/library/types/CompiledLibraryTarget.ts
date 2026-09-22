import type { CompiledSkill } from './CompiledSkill'

export interface CompiledLibraryTarget {
  compiled: CompiledSkill[]
  missing: string[]
}
