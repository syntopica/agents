import type { ApplySelectedMcpInput } from './types/ApplySelectedMcpInput'

/**
 * Converges the MCP domain, or returns the ownership already on record when
 * this run does not converge it: rewriting ownership from an apply that never
 * ran would disown servers that are still installed.
 */
export const applySelectedMcp = async ({
  selected,
  owned,
  run,
}: ApplySelectedMcpInput) =>
  selected ? await run() : { owned: owned.mcp ?? {}, missing: [] as string[] }
