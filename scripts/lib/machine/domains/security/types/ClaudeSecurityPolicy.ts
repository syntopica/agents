export interface ClaudeSecurityPolicy {
  profiles: ['claude-personal', 'claude-secondary']
  defaultMode: 'auto'
  skipDangerousModePermissionPrompt: true
  remoteControlAtStartup: boolean
  remoteControlExceptionReason?: string
}
