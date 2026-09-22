export interface WriteClaudeConfigInput {
  path: string
  servers: Record<string, unknown>
  ownedNames: string[]
}
