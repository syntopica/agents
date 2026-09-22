import type { PluginsState } from '../types/PluginsState'

export const createPluginsState = (
  overrides: Partial<PluginsState> = {},
): PluginsState => ({
  marketplaces: [
    { name: 'official', source: 'github:anthropics/claude-plugins-official' },
  ],
  installed: [
    {
      id: 'alpha@official',
      scope: 'user',
      version: '1.0.0',
      installPath: '/cache/official/alpha/1.0.0',
      gitCommitSha: 'abc123',
    },
  ],
  enabledByProfile: { 'claude-personal': {}, 'claude-secondary': {} },
  ...overrides,
})
