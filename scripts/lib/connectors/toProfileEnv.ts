/**
 * The environment one profile's `claude` invocation needs. Favish sets
 * `CLAUDE_CONFIG_DIR`; personal must have it *removed* rather than left alone,
 * because the personal profile is the default location (`~/.claude.json`) and
 * an inherited value from a Favish session would silently probe Favish and
 * report the result as personal's. Pinning it to `~/.claude` is also wrong:
 * that directory holds its own smaller `.claude.json` with a different server
 * list.
 */
export const toProfileEnv = (
  profile: 'claude-personal' | 'claude-favish',
  home: string,
  base: NodeJS.ProcessEnv,
): NodeJS.ProcessEnv => {
  const env = { ...base }

  if (profile === 'claude-favish') {
    env['CLAUDE_CONFIG_DIR'] = `${home}/.claude-favish`
    return env
  }

  delete env['CLAUDE_CONFIG_DIR']

  return env
}
