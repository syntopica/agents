import type { ClaudeSettingsPaths } from './ClaudeSettingsPaths'

export interface PlanClaudeSettingsChanges {
  profile: keyof ClaudeSettingsPaths
  key: string
}
