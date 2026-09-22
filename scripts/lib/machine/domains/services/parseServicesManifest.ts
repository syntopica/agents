import { collectServiceErrors } from './collectServiceErrors'
import type { ServicesManifest } from './types/ServicesManifest'
import type { ServicesManifestParseResult } from './types/ServicesManifestParseResult'

export const parseServicesManifest = (
  raw: unknown,
): ServicesManifestParseResult => {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { ok: false, errors: ['manifest must be an object'] }
  }

  const manifest = raw as Record<string, unknown>
  const errors: string[] = []

  for (const key of Object.keys(manifest)) {
    if (!new Set(['version', 'services']).has(key)) {
      errors.push(`manifest.${key} is not supported`)
    }
  }

  if (manifest['version'] !== 1) {
    errors.push('manifest.version must be 1')
  }

  if (!Array.isArray(manifest['services'])) {
    errors.push('manifest.services must be an array')
  } else {
    manifest['services'].forEach((service, index) => {
      collectServiceErrors(service, index, errors)
    })
  }

  return errors.length === 0
    ? { ok: true, manifest: raw as unknown as ServicesManifest }
    : {
        ok: false,
        errors: errors.toSorted((left, right) => left.localeCompare(right)),
      }
}
