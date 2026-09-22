import type { McpOverride } from './McpOverride'
import type { McpTarget } from './McpTarget'
import type { McpValue } from './McpValue'

export interface McpServer {
  targets: McpTarget[]
  transport: 'stdio' | 'http' | 'sse'
  command?: string
  args?: McpValue[]
  url?: string
  env?: Record<string, McpValue>
  headers?: Record<string, McpValue>
  startup_timeout_sec?: number
  required?: boolean
  default_tools_approval_mode?: 'auto' | 'prompt' | 'writes' | 'approve'
  disabled?: boolean
  target_overrides?: Partial<Record<McpTarget, McpOverride>>
}
