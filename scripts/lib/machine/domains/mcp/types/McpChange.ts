import type { McpTarget } from './McpTarget'

export interface McpChange {
  target: McpTarget
  name: string
  operation: 'add' | 'update' | 'remove'
}
