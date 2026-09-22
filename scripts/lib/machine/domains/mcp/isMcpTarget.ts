import { MCP_TARGETS } from './constants/MCP_TARGETS'
import type { McpTarget } from './types/McpTarget'

export const isMcpTarget = (value: unknown): value is McpTarget =>
  typeof value === 'string' &&
  (MCP_TARGETS as readonly string[]).includes(value)
