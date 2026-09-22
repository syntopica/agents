import { IDE_REGISTRY } from '../link/constants/IDE_REGISTRY'
import { collectPlatformDefinitionErrors } from './collectPlatformDefinitionErrors'
import type { PlatformManifest } from './types/PlatformManifest'
import type { PlatformManifestParseResult } from './types/PlatformManifestParseResult'

export const parsePlatformManifest = (
  raw: unknown,
): PlatformManifestParseResult => {
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, errors: ['platform manifest must be an object'] }
  }

  const manifest = raw as Record<string, unknown>
  const errors: string[] = []

  if (manifest['version'] !== 1)
    errors.push('platform manifest version must be 1')
  if (!Array.isArray(manifest['platforms'])) {
    return {
      ok: false,
      errors: [...errors, 'platforms must be an array'].toSorted(
        (left, right) => left.localeCompare(right),
      ),
    }
  }

  const registryIds = new Set(IDE_REGISTRY.map(({ id }) => id))
  const seen = new Set<string>()

  for (const [index, platform] of manifest['platforms'].entries()) {
    const registryId = collectPlatformDefinitionErrors(
      platform,
      index,
      registryIds,
      errors,
    )
    if (registryId === undefined) continue
    if (seen.has(registryId))
      errors.push(`${registryId}: duplicate registry id`)
    seen.add(registryId)
  }

  for (const registryId of registryIds) {
    if (!seen.has(registryId))
      errors.push(`${registryId}: registered platform is missing`)
  }

  if (errors.length > 0) {
    return {
      ok: false,
      errors: errors.toSorted((left, right) => left.localeCompare(right)),
    }
  }
  return { ok: true, manifest: raw as PlatformManifest }
}
