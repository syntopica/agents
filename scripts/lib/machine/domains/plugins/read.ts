import { readEnabledPlugins } from './readEnabledPlugins'
import { readInstalledPlugins } from './readInstalledPlugins'
import { readMarketplaces } from './readMarketplaces'
import type { PluginsPaths } from './types/PluginsPaths'
import type { PluginsState } from './types/PluginsState'

export const read = async (paths: PluginsPaths): Promise<PluginsState> => ({
  marketplaces: await readMarketplaces(paths.marketplaces),
  installed: await readInstalledPlugins(paths.installed),
  enabledByProfile: {
    'claude-personal': await readEnabledPlugins(
      paths.settings['claude-personal'],
    ),
    'claude-secondary': await readEnabledPlugins(
      paths.settings['claude-secondary'],
    ),
  },
})
