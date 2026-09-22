import type { DeclaredPlugin } from './DeclaredPlugin'
import type { PluginMarketplaceEntry } from './PluginMarketplaceEntry'

export interface PluginsManifestDocument {
  version: 1
  marketplaces: PluginMarketplaceEntry[]
  plugins: DeclaredPlugin[]
}
