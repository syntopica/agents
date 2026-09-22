import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import type { PluginMarketplaceEntry } from './types/PluginMarketplaceEntry'

export const findOrphanCacheDirectories = async ({
  cacheDir,
  marketplaces,
}: {
  cacheDir: string
  marketplaces: PluginMarketplaceEntry[]
}): Promise<string[]> => {
  const known = new Set(marketplaces.map((marketplace) => marketplace.name))

  try {
    const entries = await readdir(cacheDir, { withFileTypes: true })

    return entries
      .filter((entry) => entry.isDirectory() && !known.has(entry.name))
      .map((entry) => join(cacheDir, entry.name))
      .sort((left, right) => left.localeCompare(right))
  } catch {
    return []
  }
}
