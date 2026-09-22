import type { PluginChange } from './PluginChange'

export interface PluginsApplyResult {
  applied: PluginChange[]
  manual: PluginChange[]
  failed: { change: PluginChange; error: string }[]
}
