import { normalizeCodexServer } from './normalizeCodexServer'
import type { McpState } from './types/McpState'
import type { McpTarget } from './types/McpTarget'

export const actualServersFor = (
  state: McpState,
  target: McpTarget,
): Record<string, unknown> => {
  const raw = state.byTarget[target]

  if (target !== 'codex') {
    return raw
  }

  return Object.fromEntries(
    Object.entries(raw).map(([name, record]) => [
      name,
      normalizeCodexServer(record as Record<string, string>),
    ]),
  )
}
