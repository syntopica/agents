import type { CacheEntry } from './CacheEntry'

export interface CacheHygieneReport {
  entries: number
  stale: CacheEntry[]
  orphanDirectories: string[]
}
