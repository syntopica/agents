import type { CurationManifest } from './types/CurationManifest'
import type { MergeSeedIntoManifestResult } from './types/MergeSeedIntoManifestResult'

export const mergeSeedIntoManifest = (
  existing: CurationManifest,
  seeded: CurationManifest,
): MergeSeedIntoManifestResult => {
  const entries = { ...existing.entries }
  const added: string[] = []

  for (const [name, entry] of Object.entries(seeded.entries)) {
    if (entries[name] !== undefined) {
      continue
    }

    entries[name] = entry
    added.push(name)
  }

  return { manifest: { ...existing, entries }, added }
}
