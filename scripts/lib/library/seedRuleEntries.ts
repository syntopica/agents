import type { CurationEntry } from './types/CurationEntry'

export const seedRuleEntries = (
  rulePaths: string[],
  authoredSource: string,
) => {
  const entries: Record<string, CurationEntry> = {}

  for (const path of rulePaths) {
    entries[`rules/${path}`] = {
      state: 'adopted',
      source: authoredSource,
      reason: 'authored here',
    }
  }

  return entries
}
