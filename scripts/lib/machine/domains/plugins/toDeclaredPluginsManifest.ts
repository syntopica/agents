import { PLUGIN_PROFILES } from './PLUGIN_PROFILES'
import type { PluginsManifest } from './types/PluginsManifest'
import type { PluginsManifestDocument } from './types/PluginsManifestDocument'

/**
 * Turns an observed capture into a declarable manifest. The two shapes differ
 * on purpose: capture records a tri-state, because a plugin can simply be
 * absent from a profile's settings, while a declaration has to be a decision.
 * `undeclared` therefore collapses to false - a plugin the settings never
 * enable is not enabled.
 */
export const toDeclaredPluginsManifest = (
  manifest: PluginsManifest,
): PluginsManifestDocument => ({
  version: 1,
  marketplaces: manifest.marketplaces,
  plugins: manifest.plugins.map((plugin) => ({
    id: plugin.id,
    version: plugin.version,
    enabled: Object.fromEntries(
      PLUGIN_PROFILES.map((profile) => [
        profile,
        plugin.enablement[profile] === 'enabled',
      ]),
    ) as PluginsManifestDocument['plugins'][number]['enabled'],
  })),
})
