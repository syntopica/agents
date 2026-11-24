import type { CurationManifest } from '../types/CurationManifest'

export const PARKED_MANIFEST: CurationManifest = {
  version: 1,
  entries: {
    live: { state: 'adopted' },
    shelved: { state: 'parked' },
    shelvedBundle: { state: 'parked' },
    realDir: { state: 'parked' },
    elsewhere: { state: 'parked' },
  },
}
