import type { PluginProfile } from './PluginProfile'

export interface PluginsPaths {
  marketplaces: string
  installed: string
  cache: string
  settings: Record<PluginProfile, string>
}
