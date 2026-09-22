import { renderClaudeServers } from '../../renderers/claude/renderClaudeServers'
import { renderCursorServers } from '../../renderers/cursor/renderCursorServers'
import { renderGeminiServers } from '../../renderers/gemini/renderGeminiServers'
import { actualServersFor } from './actualServersFor'
import { MCP_TARGETS } from './constants/MCP_TARGETS'
import { desiredCodexServers } from './desiredCodexServers'
import { planTarget } from './planTarget'
import type { McpChange } from './types/McpChange'
import type { PlanInput } from './types/PlanInput'

export const plan = ({ manifest, state, owned, env }: PlanInput) => {
  const changes: McpChange[] = []

  for (const target of MCP_TARGETS) {
    let desired: Record<string, unknown>
    if (target === 'codex') desired = desiredCodexServers(manifest, env)
    else if (target === 'gemini')
      desired = renderGeminiServers(manifest, env).servers
    else if (target === 'cursor')
      desired = renderCursorServers(manifest, env).servers
    else desired = renderClaudeServers(manifest, target, env).servers

    changes.push(
      ...planTarget(
        target,
        desired,
        actualServersFor(state, target),
        owned[target],
      ),
    )
  }

  return changes
}
