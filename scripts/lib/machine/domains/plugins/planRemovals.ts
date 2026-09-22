import type { PluginChange } from './types/PluginChange'
import type { PluginsManifestDocument } from './types/PluginsManifestDocument'
import type { PluginsState } from './types/PluginsState'

export const planRemovals = ({
  manifest,
  state,
}: {
  manifest: PluginsManifestDocument
  state: PluginsState
}): PluginChange[] => {
  const declared = new Set(manifest.plugins.map((plugin) => plugin.id))

  return state.installed
    .filter((plugin) => !declared.has(plugin.id))
    .map((plugin) => ({
      operation: 'remove' as const,
      id: plugin.id,
      detail: plugin.version,
    }))
}
