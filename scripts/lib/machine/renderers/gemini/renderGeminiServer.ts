import type { McpServer } from '../../domains/mcp/types/McpServer'
import { renderClaudeValueMap } from '../claude/renderClaudeValueMap'
import { toStringArgs } from '../claude/toStringArgs'

export const renderGeminiServer = (
  server: McpServer,
  env: NodeJS.ProcessEnv,
) => {
  const envMap = renderClaudeValueMap(server.env ?? {}, env)
  const headerMap = renderClaudeValueMap(server.headers ?? {}, env)
  const missing = [...envMap.missing, ...headerMap.missing]
  if (missing.length > 0) return { rendered: undefined, missing }

  const timeout =
    server.startup_timeout_sec === undefined
      ? {}
      : { timeout: server.startup_timeout_sec * 1000 }

  if (server.transport === 'stdio') {
    const args = toStringArgs(
      server.args,
      server.target_overrides?.gemini?.args_append ?? [],
    )
    return {
      rendered: {
        command: server.command,
        ...(args.length > 0 ? { args } : {}),
        ...(Object.keys(envMap.values).length > 0
          ? { env: envMap.values }
          : {}),
        ...timeout,
      },
      missing,
    }
  }

  return {
    rendered: {
      ...(server.transport === 'http'
        ? { httpUrl: server.url }
        : { url: server.url }),
      ...(Object.keys(headerMap.values).length > 0
        ? { headers: headerMap.values }
        : {}),
      ...timeout,
    },
    missing,
  }
}
