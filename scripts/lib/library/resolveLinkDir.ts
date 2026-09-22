import { join } from 'node:path'
import type { SkillTarget } from './types/SkillTarget'

/**
 * Where a target's links belong. Only claude has a default: every other target
 * compiles to its own format, so falling back to `~/.claude/skills` silently
 * filled Claude's directory with foreign skills - measured 2026-08-25, when
 * linking three targets in a row left 42 of Claude's skills pointing at
 * codex-compiled output.
 */
export const resolveLinkDir = ({
  into,
  target,
  home,
}: {
  into: string | undefined
  target: SkillTarget
  home: string
}): string | undefined => {
  if (into !== undefined) {
    return into
  }

  return target === 'claude' ? join(home, '.claude', 'skills') : undefined
}
