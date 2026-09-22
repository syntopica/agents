import { MCP_TARGETS } from '../constants/MCP_TARGETS'
import type { McpState } from '../types/McpState'
import type { McpTarget } from '../types/McpTarget'

export const collectServerTargets = (
  state: McpState,
): Map<string, McpTarget[]> => {
  const byServer = new Map<string, McpTarget[]>()

  for (const target of MCP_TARGETS) {
    for (const name of Object.keys(state.byTarget[target])) {
      byServer.set(name, [...(byServer.get(name) ?? []), target])
    }
  }

  return byServer
}
