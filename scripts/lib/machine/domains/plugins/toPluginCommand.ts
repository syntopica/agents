import { dirname } from 'node:path'
import type { PluginChange } from './types/PluginChange'
import type { PluginCommand } from './types/PluginCommand'
import type { PluginsPaths } from './types/PluginsPaths'

/**
 * Maps a planned change to the claude CLI invocation that performs it. The CLI
 * owns the cache and marketplace state, so apply never edits those files by
 * hand. A pin returns undefined: the CLI cannot install a specific version, so
 * version drift stays a manual action.
 */
export const toPluginCommand = (
  change: PluginChange,
  paths: PluginsPaths,
): PluginCommand | undefined => {
  if (change.operation === 'install') {
    return {
      argv: [
        'claude',
        'plugin',
        'install',
        '--scope',
        'user',
        '--yes',
        change.id,
      ],
    }
  }

  if (change.operation === 'remove') {
    return {
      argv: ['claude', 'plugin', 'uninstall', '--scope', 'user', change.id],
    }
  }

  if (change.operation === 'enable' || change.operation === 'disable') {
    if (change.profile === undefined) {
      return undefined
    }

    return {
      argv: [
        'claude',
        'plugin',
        change.operation,
        '--scope',
        'user',
        change.id,
      ],
      env: { CLAUDE_CONFIG_DIR: dirname(paths.settings[change.profile]) },
    }
  }

  return undefined
}
