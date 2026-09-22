import type { McpServer } from '../../domains/mcp/types/McpServer'
import { toStringArgs } from '../claude/toStringArgs'
import { escapeTomlString } from './escapeTomlString'
import { renderCodexHeaderTables } from './renderCodexHeaderTables'

export const renderCodexServer = (
  name: string,
  server: McpServer,
  environment: Record<string, string>,
) => {
  const lines = [`[mcp_servers.${name}]`]

  if (server.transport === 'stdio') {
    lines.push(`command = ${escapeTomlString(server.command ?? '')}`)
    const args = toStringArgs(
      server.args,
      server.target_overrides?.codex?.args_append ?? [],
    )
    if (args.length > 0) {
      lines.push(`args = [${args.map(escapeTomlString).join(', ')}]`)
    }
  } else {
    lines.push(`url = ${escapeTomlString(server.url ?? '')}`)
  }

  if (server.startup_timeout_sec !== undefined) {
    lines.push(`startup_timeout_sec = ${String(server.startup_timeout_sec)}`)
  }
  if (server.required !== undefined) {
    lines.push(`required = ${String(server.required)}`)
  }
  if (server.default_tools_approval_mode !== undefined) {
    lines.push(
      `default_tools_approval_mode = ${escapeTomlString(server.default_tools_approval_mode)}`,
    )
  }

  const environmentEntries = Object.entries(environment).map(
    ([key, value]) => `${key} = ${escapeTomlString(value)}`,
  )
  if (environmentEntries.length > 0) {
    lines.push('', `[mcp_servers.${name}.env]`, ...environmentEntries)
  }

  lines.push(...renderCodexHeaderTables(name, server.headers ?? {}))
  return lines.join('\n')
}
