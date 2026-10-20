import type { PlanRemovalsInput } from './types/PlanRemovalsInput'
import type { PluginChange } from './types/PluginChange'

export const planRemovals = ({
  manifest,
  state,
}: PlanRemovalsInput): PluginChange[] => {
  const declared = new Set(manifest.plugins.map((plugin) => plugin.id))

  return state.installed
    .filter((plugin) => !declared.has(plugin.id))
    .map((plugin) => ({
      operation: 'remove' as const,
      id: plugin.id,
      detail: plugin.version,
    }))
}
