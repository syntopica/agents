import { join } from 'node:path'
import type { McpTarget } from '../domains/mcp/types/McpTarget'
import { resolveSecondaryProfileDir } from '../instance/resolveSecondaryProfileDir'

export const resolveTargetPaths = (
  home: string,
  env: NodeJS.ProcessEnv,
): Record<McpTarget, string> => ({
  'claude-personal': join(home, '.claude.json'),
  'claude-secondary': join(
    home,
    resolveSecondaryProfileDir(env),
    '.claude.json',
  ),
  codex: join(home, '.codex', 'config.toml'),
  gemini: join(home, '.gemini', 'settings.json'),
  cursor: join(home, '.cursor', 'mcp.json'),
})
