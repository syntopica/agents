import type { ClaudeSecurityPolicy } from './ClaudeSecurityPolicy'
import type { CodexSecurityPolicy } from './CodexSecurityPolicy'

export interface SecurityManifest {
  version: 1
  claude: ClaudeSecurityPolicy
  codex: CodexSecurityPolicy
}
