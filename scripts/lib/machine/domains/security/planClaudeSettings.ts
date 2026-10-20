import type { ClaudeSecurityPolicy } from './types/ClaudeSecurityPolicy'
import type { ClaudeSettingsPaths } from './types/ClaudeSettingsPaths'
import type { PlanClaudeSettingsChanges } from './types/PlanClaudeSettingsChanges'

export const planClaudeSettings = (
  policy: ClaudeSecurityPolicy,
  settings: Record<keyof ClaudeSettingsPaths, Record<string, unknown>>,
) => {
  const changes: PlanClaudeSettingsChanges[] = []

  for (const profile of policy.profiles) {
    const current = settings[profile]
    const permissions =
      typeof current['permissions'] === 'object' &&
      current['permissions'] !== null
        ? (current['permissions'] as Record<string, unknown>)
        : {}

    if (permissions['defaultMode'] !== policy.defaultMode) {
      changes.push({ profile, key: 'permissions.defaultMode' })
    }
    if (
      current['skipDangerousModePermissionPrompt'] !==
      policy.skipDangerousModePermissionPrompt
    ) {
      changes.push({ profile, key: 'skipDangerousModePermissionPrompt' })
    }
    if (current['remoteControlAtStartup'] !== policy.remoteControlAtStartup) {
      changes.push({ profile, key: 'remoteControlAtStartup' })
    }
  }

  return changes
}
