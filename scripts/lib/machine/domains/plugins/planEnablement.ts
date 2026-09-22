import { PLUGIN_PROFILES } from './PLUGIN_PROFILES'
import { toEnablement } from './toEnablement'
import type { DeclaredPlugin } from './types/DeclaredPlugin'
import type { PluginChange } from './types/PluginChange'
import type { PluginsState } from './types/PluginsState'

export const planEnablement = ({
  plugin,
  state,
}: {
  plugin: DeclaredPlugin
  state: PluginsState
}): PluginChange[] =>
  PLUGIN_PROFILES.flatMap((profile) => {
    const current = toEnablement(state.enabledByProfile[profile], plugin.id)
    const wanted = plugin.enabled[profile] ? 'enabled' : 'disabled'

    return current === wanted
      ? []
      : [
          {
            operation: plugin.enabled[profile]
              ? ('enable' as const)
              : ('disable' as const),
            id: plugin.id,
            detail: `${profile} is ${current}`,
            profile,
          },
        ]
  })
