import { toEnablement } from './toEnablement'
import { toPluginMarketplace } from './toPluginMarketplace'
import type { PluginsManifest } from './types/PluginsManifest'
import type { PluginsState } from './types/PluginsState'

export const toManifest = (state: PluginsState): PluginsManifest => ({
  marketplaces: state.marketplaces,
  plugins: state.installed
    .map((plugin) => ({
      id: plugin.id,
      marketplace: toPluginMarketplace(plugin.id),
      scope: plugin.scope,
      version: plugin.version,
      ...(plugin.gitCommitSha === undefined
        ? {}
        : { gitCommitSha: plugin.gitCommitSha }),
      enablement: {
        'claude-personal': toEnablement(
          state.enabledByProfile['claude-personal'],
          plugin.id,
        ),
        'claude-secondary': toEnablement(
          state.enabledByProfile['claude-secondary'],
          plugin.id,
        ),
      },
    }))
    .sort(
      (left, right) =>
        left.id.localeCompare(right.id) ||
        left.scope.localeCompare(right.scope),
    ),
})
