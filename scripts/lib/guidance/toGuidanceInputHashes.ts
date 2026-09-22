import type { GuidanceInputHash } from './types/GuidanceInputHash'

export const toGuidanceInputHashes = (
  hashes: Record<string, string>,
): GuidanceInputHash[] =>
  Object.entries(hashes)
    .map(([path, sha256]) => ({ path, sha256 }))
    .toSorted((left, right) => left.path.localeCompare(right.path))
