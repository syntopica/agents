import type { CurationManifest } from '../types/CurationManifest'

export const SEEDED_MANIFEST: CurationManifest = {
  version: 1,
  entries: {
    promoted: { state: 'parked', reason: 'seeded' },
    fresh: { state: 'parked', reason: 'seeded' },
  },
}
