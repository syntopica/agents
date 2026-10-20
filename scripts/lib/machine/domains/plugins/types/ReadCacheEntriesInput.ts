import type { PluginMarketplaceEntry } from './PluginMarketplaceEntry'

export interface ReadCacheEntriesInput {
  cacheDir: string
  marketplaces: PluginMarketplaceEntry[]
}
