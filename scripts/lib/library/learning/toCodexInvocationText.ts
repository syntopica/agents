import type { ToCodexInvocationTextPayload } from './types/ToCodexInvocationTextPayload'
import type { ToCodexInvocationTextRecord } from './types/ToCodexInvocationTextRecord'
/**
 * The command text of one Codex rollout line, or undefined when the line is
 * not the agent invoking a tool. Rollouts also carry the injected skill
 * catalogue (a `developer` message) and command output, both of which name
 * every skill without anyone using it - counting those is what made Codex-side
 * usage unmeasurable before 2026-08-24.
 */
export const toCodexInvocationText = (line: string): string | undefined => {
  let parsed: unknown

  try {
    parsed = JSON.parse(line)
  } catch {
    return undefined
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return undefined
  }

  const record = parsed as ToCodexInvocationTextRecord

  if (
    record.type !== 'response_item' ||
    typeof record.payload !== 'object' ||
    record.payload === null
  ) {
    return undefined
  }

  const payload = record.payload as ToCodexInvocationTextPayload

  if (payload.type !== 'custom_tool_call' && payload.type !== 'function_call') {
    return undefined
  }

  return JSON.stringify(payload)
}
