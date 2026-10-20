export interface WriteGeminiSettingsInput {
  path: string
  servers: Record<string, unknown>
  ownedNames: string[]
}
