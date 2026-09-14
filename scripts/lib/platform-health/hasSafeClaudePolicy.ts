export const hasSafeClaudePolicy = (settings: Record<string, unknown>) => {
  const permissions = settings['permissions']
  return (
    typeof permissions === 'object' &&
    permissions !== null &&
    (permissions as Record<string, unknown>)['defaultMode'] === 'auto' &&
    settings['skipDangerousModePermissionPrompt'] === true &&
    settings['remoteControlAtStartup'] === true
  )
}
