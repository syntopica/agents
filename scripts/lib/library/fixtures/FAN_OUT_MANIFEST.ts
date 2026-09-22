import type { CurationManifest } from '../types/CurationManifest'

export const FAN_OUT_MANIFEST: CurationManifest = {
  version: 1,
  entries: {
    adoptedEverywhere: { state: 'adopted' },
    forkedOne: {
      state: 'forked',
      patch: 'patches/forked-one.patch',
      upstreamHash: 'h',
    },
    parkedOne: { state: 'parked', reason: 'not needed yet' },
    extractedOne: { state: 'extracted', extractedInto: 'ours' },
    codexOnly: { state: 'adopted', targets: ['codex'] },
  },
}
