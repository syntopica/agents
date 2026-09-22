import type { PluginManifestEntry } from './PluginManifestEntry'
import type { PluginMarketplaceEntry } from './PluginMarketplaceEntry'

export interface PluginsManifest {
  marketplaces: PluginMarketplaceEntry[]
  plugins: PluginManifestEntry[]
}
