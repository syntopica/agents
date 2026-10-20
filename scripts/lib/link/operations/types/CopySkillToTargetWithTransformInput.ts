export interface CopySkillToTargetWithTransformInput {
  source: string
  target: string
  transformContent: (content: string, relativePath: string) => string
}
