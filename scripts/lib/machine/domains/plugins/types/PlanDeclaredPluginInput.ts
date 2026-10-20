import type { DeclaredPlugin } from './DeclaredPlugin'
import type { InstalledPlugin } from './InstalledPlugin'
import type { PluginsState } from './PluginsState'

export interface PlanDeclaredPluginInput {
  plugin: DeclaredPlugin
  installed: InstalledPlugin | undefined
  state: PluginsState
}
