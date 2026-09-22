import { planDeclaredPlugin } from './planDeclaredPlugin'
import { planRemovals } from './planRemovals'
import type { PluginChange } from './types/PluginChange'
import type { PluginsManifestDocument } from './types/PluginsManifestDocument'
import type { PluginsState } from './types/PluginsState'

export const plan = ({
  manifest,
  state,
}: {
  manifest: PluginsManifestDocument
  state: PluginsState
}): PluginChange[] => {
  const actual = new Map(state.installed.map((plugin) => [plugin.id, plugin]))

  return [
    ...manifest.plugins.flatMap((plugin) =>
      planDeclaredPlugin({ plugin, installed: actual.get(plugin.id), state }),
    ),
    ...planRemovals({ manifest, state }),
  ]
}
