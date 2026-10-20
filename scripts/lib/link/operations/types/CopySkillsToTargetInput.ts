export interface CopySkillsToTargetInput {
  sourceDir: string
  targetDir: string
  skillNames: string[]
  prefix: string
  flatten?: boolean
}
