import { join } from 'node:path'
import type { ClaudeSettingsPaths } from '../domains/security/types/ClaudeSettingsPaths'
import { resolveSecondaryProfileDir } from '../instance/resolveSecondaryProfileDir'

export const resolveClaudeSettingsPaths = (
  home: string,
  env: NodeJS.ProcessEnv,
): ClaudeSettingsPaths => ({
  'claude-personal': join(home, '.claude', 'settings.json'),
  'claude-secondary': join(
    home,
    resolveSecondaryProfileDir(env),
    'settings.json',
  ),
})
