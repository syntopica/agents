import { rm } from 'node:fs/promises'
import { findOrphanCacheDirectories } from './findOrphanCacheDirectories'
import type { PruneOrphanCacheDirectoriesInput } from './types/PruneOrphanCacheDirectoriesInput'

/**
 * Removes cache directories that belong to no known marketplace. Stale version
 * entries inside marketplace directories are deliberately left alone: capture
 * does not yet resolve settings.json references (a statusLine can point into a
 * version that reads as stale), so deleting them could break a live reference.
 */
export const pruneOrphanCacheDirectories = async ({
  cacheDir,
  marketplaces,
}: PruneOrphanCacheDirectoriesInput): Promise<string[]> => {
  const orphans = await findOrphanCacheDirectories({ cacheDir, marketplaces })

  for (const orphan of orphans) {
    await rm(orphan, { recursive: true, force: true })
  }

  return orphans
}
