import type { McpServer } from './types/McpServer'
import type { McpTarget } from './types/McpTarget'
import type { McpValue } from './types/McpValue'

export const serverEnvForTarget = (
  server: McpServer,
  target: McpTarget,
): Record<string, McpValue> => ({
  ...server.env,
  ...server.target_overrides?.[target]?.env,
})
