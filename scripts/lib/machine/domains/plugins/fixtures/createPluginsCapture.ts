import type { PluginsManifest } from '../types/PluginsManifest'

/**
 * A capture as `machine:capture:plugins` emits it: tri-state enablement, and
 * the marketplace, scope and commit fields a declaration does not carry.
 */
export const createPluginsCapture = (): PluginsManifest => ({
  marketplaces: [
    { name: 'official', source: 'github:anthropics/claude-plugins-official' },
  ],
  plugins: [
    {
      id: 'alpha@official',
      marketplace: 'official',
      scope: 'user',
      version: '1.0.0',
      gitCommitSha: 'abc123',
      enablement: {
        'claude-personal': 'enabled',
        'claude-secondary': 'undeclared',
      },
    },
    {
      id: 'beta@official',
      marketplace: 'official',
      scope: 'user',
      version: '2.0.0',
      enablement: {
        'claude-personal': 'disabled',
        'claude-secondary': 'enabled',
      },
    },
  ],
})
