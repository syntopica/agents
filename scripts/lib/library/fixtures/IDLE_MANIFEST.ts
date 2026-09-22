import type { CurationManifest } from '../types/CurationManifest'

export const IDLE_MANIFEST: CurationManifest = {
  version: 1,
  entries: {
    used: {
      state: 'adopted',
      source: 'someone/upstream',
      decidedAt: '2026-01-01',
    },
    idle: {
      state: 'adopted',
      source: 'someone/upstream',
      decidedAt: '2026-01-01',
    },
    justPromoted: {
      state: 'adopted',
      source: 'someone/upstream',
      decidedAt: '2026-08-18',
    },
    ours: {
      state: 'adopted',
      source: 'rocket-agents',
      decidedAt: '2026-01-01',
    },
    parked: {
      state: 'parked',
      reason: 'not needed',
      source: 'someone/upstream',
    },
  },
}
