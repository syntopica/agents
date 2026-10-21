export interface ClaudeSecurityPolicy {
  profiles: ['claude-personal', 'claude-secondary']
  defaultMode: 'auto'
  skipDangerousModePermissionPrompt: boolean
  remoteControlAtStartup: boolean
  remoteControlExceptionReason?: string
}
