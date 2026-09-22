/**
 * Fences the generated block inside the user's own `~/.codex/config.toml`.
 * Everything outside them is hand-written and must survive a regeneration.
 */
export const CODEX_SKILL_TRIM_MARKERS = {
  start: '# BEGIN generated skills trim (rocket-agents)',
  end: '# END generated skills trim (rocket-agents)',
} as const
