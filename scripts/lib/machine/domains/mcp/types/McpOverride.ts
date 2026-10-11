import type { McpValue } from './McpValue'

export interface McpOverride {
  args_append?: string[]
  env?: Record<string, McpValue>
}
