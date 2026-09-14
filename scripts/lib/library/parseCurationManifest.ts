import { collectEntryErrors } from './collectEntryErrors'
import type { CurationManifest } from './types/CurationManifest'
import type { ManifestParseResult } from './types/ManifestParseResult'

export const parseCurationManifest = (raw: unknown): ManifestParseResult => {
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, errors: ['manifest must be an object'] }
  }

  const record = raw as Record<string, unknown>

  if (typeof record['version'] !== 'number') {
    return { ok: false, errors: ['manifest needs a numeric version'] }
  }

  if (typeof record['entries'] !== 'object' || record['entries'] === null) {
    return { ok: false, errors: ['manifest.entries must be an object'] }
  }

  const errors: string[] = []

  for (const [name, entry] of Object.entries(
    record['entries'] as Record<string, unknown>,
  )) {
    collectEntryErrors(name, entry, errors)
  }

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  return { ok: true, manifest: raw as CurationManifest }
}
