import type { ApplySelectedClaudeSettingsInput } from './types/ApplySelectedClaudeSettingsInput'

/**
 * Writes the Claude security policy, or keeps the ownership already on record
 * when this run does not converge the security domain.
 */
export const applySelectedClaudeSettings = async ({
  selected,
  owned,
  run,
}: ApplySelectedClaudeSettingsInput) =>
  selected ? await run() : (owned.security ?? {})
