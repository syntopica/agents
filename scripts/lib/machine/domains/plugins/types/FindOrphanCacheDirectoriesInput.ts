import type { PluginMarketplaceEntry } from './PluginMarketplaceEntry'

export interface FindOrphanCacheDirectoriesInput {
  cacheDir: string
  marketplaces: PluginMarketplaceEntry[]
}
