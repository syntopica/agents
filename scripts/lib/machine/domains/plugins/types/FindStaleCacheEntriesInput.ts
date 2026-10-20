import type { CacheEntry } from './CacheEntry'

export interface FindStaleCacheEntriesInput {
  entries: CacheEntry[]
  referencedPaths: string[]
}
