import { join } from 'node:path'
import type { PluginsPaths } from '../domains/plugins/types/PluginsPaths'
import { resolveClaudeSettingsPaths } from './resolveClaudeSettingsPaths'

export const resolvePluginsPaths = (
  home: string,
  env: NodeJS.ProcessEnv,
): PluginsPaths => ({
  marketplaces: join(home, '.claude', 'plugins', 'known_marketplaces.json'),
  installed: join(home, '.claude', 'plugins', 'installed_plugins.json'),
  cache: join(home, '.claude', 'plugins', 'cache'),
  settings: resolveClaudeSettingsPaths(home, env),
})
