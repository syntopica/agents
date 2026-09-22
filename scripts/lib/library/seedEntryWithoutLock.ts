import type { CurationEntry } from './types/CurationEntry'

export const seedEntryWithoutLock = (
  name: string,
  ours: string[],
): CurationEntry => {
  if (ours.includes(name)) {
    return {
      state: 'adopted',
      source: 'rocket-agents',
      reason: 'authored here',
    }
  }

  return {
    state: 'parked',
    reason:
      'on disk with no recorded provenance; origin must be established before it can update',
  }
}
