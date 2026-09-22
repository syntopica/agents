import type { CurationEntry } from './types/CurationEntry'

export const isFannedOut = (entry: CurationEntry, target: string) => {
  if (entry.state !== 'adopted' && entry.state !== 'forked') {
    return false
  }

  return entry.targets === undefined || entry.targets.includes(target)
}
