import type { DeclaredPlugin } from './DeclaredPlugin'
import type { PluginsState } from './PluginsState'

export interface PlanEnablementInput {
  plugin: DeclaredPlugin
  state: PluginsState
}
