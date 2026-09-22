export interface MarketplaceEntry {
  name: string
  source: string
  description: string
  version: string
  author?: { name: string }
  license?: string
  keywords?: string[]
}
