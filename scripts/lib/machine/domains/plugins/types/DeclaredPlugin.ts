import type { PluginProfile } from './PluginProfile'

export interface DeclaredPlugin {
  id: string
  version: string
  enabled: Record<PluginProfile, boolean>
}
