import type { McpServer } from '../../domains/mcp/types/McpServer'
import { toStringArgs } from '../claude/toStringArgs'
import { renderCursorValueMap } from './renderCursorValueMap'

export const renderCursorServer = (
  server: McpServer,
  env: NodeJS.ProcessEnv,
) => {
  const envMap = renderCursorValueMap(server.env ?? {}, env)
  const headerMap = renderCursorValueMap(server.headers ?? {}, env)
  const missing = [...envMap.missing, ...headerMap.missing]
  if (missing.length > 0) return { rendered: undefined, missing }

  if (server.transport === 'stdio') {
    const args = toStringArgs(
      server.args,
      server.target_overrides?.cursor?.args_append ?? [],
    )
    return {
      rendered: {
        command: server.command,
        ...(args.length > 0 ? { args } : {}),
        ...(Object.keys(envMap.values).length > 0
          ? { env: envMap.values }
          : {}),
      },
      missing,
    }
  }

  return {
    rendered: {
      url: server.url,
      ...(Object.keys(headerMap.values).length > 0
        ? { headers: headerMap.values }
        : {}),
    },
    missing,
  }
}
