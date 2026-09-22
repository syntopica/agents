import type { CurationManifest } from '../../types/CurationManifest'

export const PROPOSAL_MANIFEST: CurationManifest = {
  version: 1,
  entries: {
    'frontend-design': { state: 'parked', reason: 'not judged' },
    'team-communications': { state: 'adopted' },
    'old-thing': { state: 'adopted' },
  },
}
