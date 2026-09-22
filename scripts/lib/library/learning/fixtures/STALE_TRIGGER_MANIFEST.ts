import type { CurationManifest } from '../../types/CurationManifest'

export const STALE_TRIGGER_MANIFEST: CurationManifest = {
  version: 1,
  entries: {
    'frontend-design': {
      state: 'adopted',
      triggers: ['dame un PDF de contrarider'],
    },
    'core/brp-docs': { state: 'adopted', triggers: ['old phrase'] },
    untouched: { state: 'parked', reason: 'x' },
  },
}
