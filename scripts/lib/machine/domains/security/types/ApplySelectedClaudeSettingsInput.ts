import type { OwnedRecord } from '../../../ownership/OwnedRecord'
import type { writeClaudeSettings } from '../writeClaudeSettings'

export interface ApplySelectedClaudeSettingsInput {
  selected: boolean
  owned: OwnedRecord
  run: () => ReturnType<typeof writeClaudeSettings>
}
