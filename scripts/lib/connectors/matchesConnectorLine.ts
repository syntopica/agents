import type { ConnectorDefinition } from './types/ConnectorDefinition'

/**
 * Whether one `claude mcp list` line belongs to this connector. A server can
 * reach a profile two ways - configured directly, or shipped by an enabled
 * plugin, which the CLI lists as `plugin:<plugin>:<server>:`. Both satisfy the
 * connector, so matching only the bare name reports a working plugin-provided
 * server as missing.
 */
export const matchesConnectorLine = (
  line: string,
  definition: ConnectorDefinition,
): boolean => {
  if (definition.probe === 'claude-cli-prefix') {
    return line.startsWith(definition.match)
  }

  if (line.startsWith(`${definition.match}:`)) {
    return true
  }

  const segments = line.split(':')

  return segments[0] === 'plugin' && segments[2] === definition.match
}
