import { join } from 'node:path'
import type { PluginsPaths } from '../types/PluginsPaths'

export const createPluginsPaths = (home: string): PluginsPaths => ({
  marketplaces: join(home, '.claude', 'plugins', 'known_marketplaces.json'),
  installed: join(home, '.claude', 'plugins', 'installed_plugins.json'),
  cache: join(home, '.claude', 'plugins', 'cache'),
  settings: {
    'claude-personal': join(home, '.claude', 'settings.json'),
    'claude-secondary': join(home, '.claude-secondary', 'settings.json'),
  },
})
