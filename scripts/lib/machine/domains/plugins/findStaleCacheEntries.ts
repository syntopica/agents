import type { CacheEntry } from './types/CacheEntry'

/**
 * Cache directories nothing refers to. "Referenced" is wider than "installed":
 * a settings file can name a version directory directly, and that version is
 * live even though no installed plugin resolves to it.
 */
export const findStaleCacheEntries = ({
  entries,
  referencedPaths,
}: {
  entries: CacheEntry[]
  referencedPaths: string[]
}): CacheEntry[] => {
  const referenced = new Set(referencedPaths)

  return entries.filter((entry) => !referenced.has(entry.path))
}
