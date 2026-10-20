import { planDeclaredPlugin } from './planDeclaredPlugin'
import { planRemovals } from './planRemovals'
import type { PlanInput } from './types/PlanInput'
import type { PluginChange } from './types/PluginChange'

export const plan = ({ manifest, state }: PlanInput): PluginChange[] => {
  const actual = new Map(state.installed.map((plugin) => [plugin.id, plugin]))

  return [
    ...manifest.plugins.flatMap((plugin) =>
      planDeclaredPlugin({ plugin, installed: actual.get(plugin.id), state }),
    ),
    ...planRemovals({ manifest, state }),
  ]
}
