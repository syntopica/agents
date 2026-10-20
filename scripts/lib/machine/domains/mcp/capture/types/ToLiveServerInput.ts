import type { McpTarget } from '../../types/McpTarget'

export interface ToLiveServerInput {
  live: Record<string, unknown>
  target: McpTarget
}
