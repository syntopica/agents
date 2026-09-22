import type { PluginsManifestDocument } from '../types/PluginsManifestDocument'

export const createPluginsManifest = (
  overrides: Partial<PluginsManifestDocument> = {},
): PluginsManifestDocument => ({
  version: 1,
  marketplaces: [
    { name: 'official', source: 'github:anthropics/claude-plugins-official' },
  ],
  plugins: [
    {
      id: 'alpha@official',
      version: '1.0.0',
      enabled: { 'claude-personal': false, 'claude-secondary': false },
    },
  ],
  ...overrides,
})
