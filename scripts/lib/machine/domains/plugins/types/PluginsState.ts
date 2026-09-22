import type { InstalledPlugin } from './InstalledPlugin'
import type { PluginMarketplaceEntry } from './PluginMarketplaceEntry'
import type { PluginProfile } from './PluginProfile'

export interface PluginsState {
  marketplaces: PluginMarketplaceEntry[]
  installed: InstalledPlugin[]
  enabledByProfile: Record<PluginProfile, Record<string, boolean>>
}
