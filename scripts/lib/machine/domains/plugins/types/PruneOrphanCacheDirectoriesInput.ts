import type { PluginMarketplaceEntry } from './PluginMarketplaceEntry'

export interface PruneOrphanCacheDirectoriesInput {
  cacheDir: string
  marketplaces: PluginMarketplaceEntry[]
}
