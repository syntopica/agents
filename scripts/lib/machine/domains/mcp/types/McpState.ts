import type { McpTarget } from './McpTarget'

export interface McpState {
  byTarget: Record<McpTarget, Record<string, unknown>>
}
