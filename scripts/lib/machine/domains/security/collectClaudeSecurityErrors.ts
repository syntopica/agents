export const collectClaudeSecurityErrors = (
  raw: unknown,
  errors: string[],
): void => {
  if (typeof raw !== 'object' || raw === null) {
    errors.push('manifest.claude must be an object')
    return
  }
  const policy = raw as Record<string, unknown>
  const known = new Set([
    'profiles',
    'defaultMode',
    'skipDangerousModePermissionPrompt',
    'remoteControlAtStartup',
    'remoteControlExceptionReason',
  ])
  for (const key of Object.keys(policy)) {
    if (!known.has(key)) errors.push(`manifest.claude.${key} is not supported`)
  }
  if (
    !Array.isArray(policy['profiles']) ||
    policy['profiles'].length !== 2 ||
    policy['profiles'][0] !== 'claude-personal' ||
    policy['profiles'][1] !== 'claude-favish'
  ) {
    errors.push(
      'manifest.claude.profiles must preserve personal and Favish profile boundaries',
    )
  }
  if (policy['defaultMode'] !== 'auto')
    errors.push('manifest.claude.defaultMode must be auto')
  if (policy['skipDangerousModePermissionPrompt'] !== true) {
    errors.push(
      'manifest.claude.skipDangerousModePermissionPrompt must be true',
    )
  }
  if (typeof policy['remoteControlAtStartup'] !== 'boolean') {
    errors.push('manifest.claude.remoteControlAtStartup must be a boolean')
  }
  if (
    policy['remoteControlAtStartup'] === true &&
    (typeof policy['remoteControlExceptionReason'] !== 'string' ||
      policy['remoteControlExceptionReason'].trim().length === 0)
  ) {
    errors.push(
      'manifest.claude.remoteControlExceptionReason is required when remote control is enabled',
    )
  }
}
