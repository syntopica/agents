import type { CurationEntry } from './types/CurationEntry'
import type { LockEntry } from './types/LockEntry'

export const seedEntryFromLock = (
  name: string,
  lock: LockEntry,
  ours: string[],
): CurationEntry => {
  const provenance = {
    ...(lock.source ? { source: lock.source } : {}),
    ...(lock.sourceUrl ? { sourceUrl: lock.sourceUrl } : {}),
    ...(lock.skillPath ? { skillPath: lock.skillPath } : {}),
    ...(lock.skillFolderHash ? { upstreamHash: lock.skillFolderHash } : {}),
  }

  if (ours.includes(name)) {
    return { state: 'adopted', ...provenance, reason: 'authored here' }
  }

  return {
    state: 'parked',
    ...provenance,
    reason: 'seeded from the lock, not yet judged against measured demand',
  }
}
