import { readClaudeServers } from './readClaudeServers'
import { readCodexServers } from './readCodexServers'
import type { McpState } from './types/McpState'
import type { McpTarget } from './types/McpTarget'

export const read = async (
  paths: Record<McpTarget, string>,
): Promise<McpState> => ({
  byTarget: {
    'claude-personal': await readClaudeServers(paths['claude-personal']),
    'claude-secondary': await readClaudeServers(paths['claude-secondary']),
    codex: await readCodexServers(paths.codex),
    gemini: await readClaudeServers(paths.gemini),
    cursor: await readClaudeServers(paths.cursor),
  },
})
