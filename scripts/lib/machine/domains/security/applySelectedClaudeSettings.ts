import type { OwnedRecord } from '../../ownership/OwnedRecord'
import type { writeClaudeSettings } from './writeClaudeSettings'

/**
 * Writes the Claude security policy, or keeps the ownership already on record
 * when this run does not converge the security domain.
 */
export const applySelectedClaudeSettings = async ({
  selected,
  owned,
  run,
}: {
  selected: boolean
  owned: OwnedRecord
  run: () => ReturnType<typeof writeClaudeSettings>
}) => (selected ? await run() : (owned.security ?? {}))
