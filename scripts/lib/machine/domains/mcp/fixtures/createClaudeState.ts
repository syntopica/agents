import type { McpState } from '../types/McpState'

export const createClaudeState = (
  servers: Record<string, unknown>,
): McpState => ({
  byTarget: {
    'claude-personal': servers,
    'claude-secondary': {},
    codex: {},
    gemini: {},
    cursor: {},
  },
})
