import { resolveSecondaryProfileDir } from '../machine/instance/resolveSecondaryProfileDir'

/**
 * The environment one profile's `claude` invocation needs. The secondary
 * profile sets `CLAUDE_CONFIG_DIR`; personal must have it *removed* rather
 * than left alone, because the personal profile is the default location
 * (`~/.claude.json`) and an inherited value from a secondary session would
 * silently probe that profile and report the result as personal's. Pinning it
 * to `~/.claude` is also wrong: that directory holds its own smaller
 * `.claude.json` with a different server list.
 */
export const toProfileEnv = (
  profile: 'claude-personal' | 'claude-secondary',
  home: string,
  base: NodeJS.ProcessEnv,
): NodeJS.ProcessEnv => {
  const env = { ...base }

  if (profile === 'claude-secondary') {
    env['CLAUDE_CONFIG_DIR'] = `${home}/${resolveSecondaryProfileDir(base)}`
    return env
  }

  delete env['CLAUDE_CONFIG_DIR']

  return env
}
