import type { CurationManifest } from '../types/CurationManifest'

export const replaceTriggersInManifest = (
  manifest: CurationManifest,
  phrases: Record<string, string[]>,
  keyIndex: Record<string, string>,
  maxPerSkill: number,
): CurationManifest => {
  const learnedByKey: Record<string, string[]> = {}

  for (const [skill, learned] of Object.entries(phrases)) {
    const key = keyIndex[skill]

    if (key !== undefined) {
      learnedByKey[key] = learned.slice(0, maxPerSkill)
    }
  }

  const entries = { ...manifest.entries }

  for (const [key, entry] of Object.entries(entries)) {
    const learned = learnedByKey[key]

    if (learned !== undefined) {
      entries[key] = { ...entry, triggers: learned }
    } else if (entry.triggers !== undefined) {
      const cleaned = { ...entry }
      delete cleaned.triggers
      entries[key] = cleaned
    }
  }

  return { ...manifest, entries }
}
