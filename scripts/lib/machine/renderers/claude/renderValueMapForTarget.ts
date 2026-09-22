import type { McpValue } from '../../domains/mcp/types/McpValue'
import { renderClaudeValueMap } from './renderClaudeValueMap'

export const renderValueMapForTarget = (
  source: Record<string, McpValue>,
  env: NodeJS.ProcessEnv,
) => renderClaudeValueMap(source, env)
