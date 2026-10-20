import { join } from 'node:path'
import { readDirectoryNames } from './readDirectoryNames'
import { toRealPath } from './toRealPath'
import type { CacheEntry } from './types/CacheEntry'
import type { ReadCacheEntriesInput } from './types/ReadCacheEntriesInput'

export const readCacheEntries = async ({
  cacheDir,
  marketplaces,
}: ReadCacheEntriesInput): Promise<CacheEntry[]> => {
  const root = await toRealPath(cacheDir)
  const entries: CacheEntry[] = []

  for (const { name: marketplace } of marketplaces) {
    for (const plugin of await readDirectoryNames(join(root, marketplace))) {
      for (const version of await readDirectoryNames(
        join(root, marketplace, plugin),
      )) {
        entries.push({
          marketplace,
          plugin,
          version,
          path: join(root, marketplace, plugin, version),
        })
      }
    }
  }

  return entries.sort((left, right) => left.path.localeCompare(right.path))
}
