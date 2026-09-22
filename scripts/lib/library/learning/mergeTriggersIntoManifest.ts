import type { CurationManifest } from '../types/CurationManifest'

export const mergeTriggersIntoManifest = (
  manifest: CurationManifest,
  phrases: Record<string, string[]>,
  keyIndex: Record<string, string>,
  maxPerSkill: number,
): CurationManifest => {
  const entries = { ...manifest.entries }

  for (const [skill, learned] of Object.entries(phrases)) {
    const key = keyIndex[skill]

    if (key === undefined) {
      continue
    }

    const entry = entries[key]

    if (entry === undefined) {
      continue
    }

    const merged = [...(entry.triggers ?? [])]

    for (const phrase of learned) {
      if (!merged.includes(phrase) && merged.length < maxPerSkill) {
        merged.push(phrase)
      }
    }

    entries[key] = { ...entry, triggers: merged }
  }

  return { ...manifest, entries }
}
