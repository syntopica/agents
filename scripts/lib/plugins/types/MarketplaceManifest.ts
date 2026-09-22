import type { MarketplaceEntry } from './MarketplaceEntry'

export interface MarketplaceManifest {
  name: string
  description: string
  owner: { name: string; url?: string }
  plugins: MarketplaceEntry[]
}
