import type { CurationManifest } from '../types/CurationManifest'

export const EXISTING_MANIFEST: CurationManifest = {
  version: 1,
  entries: {
    promoted: {
      state: 'adopted',
      reason: 'measured demand',
      decidedAt: '2026-08-18',
    },
  },
}
