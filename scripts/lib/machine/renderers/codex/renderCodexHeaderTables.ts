import type { McpValue } from '../../domains/mcp/types/McpValue'
import { isSecretReference } from '../../secrets/isSecretReference'
import { escapeTomlString } from './escapeTomlString'

export const renderCodexHeaderTables = (
  name: string,
  headers: Record<string, McpValue>,
) => {
  const staticHeaders: string[] = []
  const environmentHeaders: string[] = []

  for (const [key, value] of Object.entries(headers)) {
    if (isSecretReference(value)) {
      environmentHeaders.push(`${key} = ${escapeTomlString(value.from_env)}`)
    } else {
      staticHeaders.push(`${key} = ${escapeTomlString(value)}`)
    }
  }

  const lines: string[] = []
  if (staticHeaders.length > 0) {
    lines.push('', `[mcp_servers.${name}.http_headers]`, ...staticHeaders)
  }
  if (environmentHeaders.length > 0) {
    lines.push(
      '',
      `[mcp_servers.${name}.env_http_headers]`,
      ...environmentHeaders,
    )
  }
  return lines
}
