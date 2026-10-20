import { PLUGIN_PROFILES } from './PLUGIN_PROFILES'
import { toEnablement } from './toEnablement'
import type { PlanEnablementInput } from './types/PlanEnablementInput'
import type { PluginChange } from './types/PluginChange'

export const planEnablement = ({
  plugin,
  state,
}: PlanEnablementInput): PluginChange[] =>
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
