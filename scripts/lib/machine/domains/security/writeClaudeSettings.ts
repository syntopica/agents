import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { readClaudeSettings } from './readClaudeSettings'
import type { ClaudeSecurityPolicy } from './types/ClaudeSecurityPolicy'
import type { ClaudeSettingsPaths } from './types/ClaudeSettingsPaths'

export const writeClaudeSettings = async ({
  paths,
  policy,
}: {
  paths: ClaudeSettingsPaths
  policy: ClaudeSecurityPolicy
}) => {
  const current = await readClaudeSettings(paths)
  const owned: Record<keyof ClaudeSettingsPaths, string[]> = {
    'claude-personal': [],
    'claude-secondary': [],
  }

  for (const profile of policy.profiles) {
    const existing = current[profile]
    const existingPermissions =
      typeof existing['permissions'] === 'object' &&
      existing['permissions'] !== null
        ? (existing['permissions'] as Record<string, unknown>)
        : {}
    const next = {
      ...existing,
      permissions: { ...existingPermissions, defaultMode: policy.defaultMode },
      skipDangerousModePermissionPrompt:
        policy.skipDangerousModePermissionPrompt,
      remoteControlAtStartup: policy.remoteControlAtStartup,
    }

    await mkdir(dirname(paths[profile]), { recursive: true })
    await writeFile(paths[profile], `${JSON.stringify(next, null, 2)}\n`)
    owned[profile] = [
      'permissions.defaultMode',
      'skipDangerousModePermissionPrompt',
      'remoteControlAtStartup',
    ]
  }

  return owned
}
