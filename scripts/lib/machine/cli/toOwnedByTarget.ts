import type { McpTarget } from '../domains/mcp/types/McpTarget'
import type { OwnedRecord } from '../ownership/OwnedRecord'

export const toOwnedByTarget = (
  owned: OwnedRecord,
): Record<McpTarget, string[]> => {
  const domain = owned.mcp ?? {}

  return {
    'claude-personal': domain['claude-personal'] ?? [],
    'claude-secondary': domain['claude-secondary'] ?? [],
    codex: domain['codex'] ?? [],
    gemini: domain['gemini'] ?? [],
    cursor: domain['cursor'] ?? [],
  }
}
