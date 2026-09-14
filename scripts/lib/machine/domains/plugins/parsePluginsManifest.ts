import { collectDeclaredPluginErrors } from './collectDeclaredPluginErrors'
import { collectMarketplaceErrors } from './collectMarketplaceErrors'
import type { PluginsManifestDocument } from './types/PluginsManifestDocument'
import type { PluginsManifestParseResult } from './types/PluginsManifestParseResult'

export const parsePluginsManifest = (
  raw: unknown,
): PluginsManifestParseResult => {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { ok: false, errors: ['manifest must be an object'] }
  }

  const manifest = raw as Record<string, unknown>
  const errors: string[] = []

  for (const key of Object.keys(manifest)) {
    if (!new Set(['version', 'marketplaces', 'plugins']).has(key)) {
      errors.push(`manifest.${key} is not supported`)
    }
  }

  if (manifest['version'] !== 1) {
    errors.push('manifest.version must be 1')
  }

  collectMarketplaceErrors(manifest['marketplaces'], errors)
  collectDeclaredPluginErrors(manifest['plugins'], errors)

  return errors.length === 0
    ? { ok: true, manifest: raw as unknown as PluginsManifestDocument }
    : {
        ok: false,
        errors: errors.toSorted((left, right) => left.localeCompare(right)),
      }
}
