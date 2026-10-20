export interface WriteCursorConfigInput {
  path: string
  servers: Record<string, unknown>
  ownedNames: string[]
}
