import type { ClaudeSecurityPolicy } from './ClaudeSecurityPolicy'
import type { ClaudeSettingsPaths } from './ClaudeSettingsPaths'

export interface WriteClaudeSettingsInput {
  paths: ClaudeSettingsPaths
  policy: ClaudeSecurityPolicy
}
