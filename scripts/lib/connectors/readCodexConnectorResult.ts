import { resolveConnectorBoundary } from './resolveConnectorBoundary'
import type { ConnectorDefinition } from './types/ConnectorDefinition'
import type { ProfileConnectorResult } from './types/ProfileConnectorResult'

export const readCodexConnectorResult = (
  definition: ConnectorDefinition,
  entries: Map<string, boolean | undefined> | undefined,
): ProfileConnectorResult => {
  const base = {
    id: definition.id,
    profile: 'codex' as const,
    criticality: definition.criticality,
    boundary: resolveConnectorBoundary(definition),
  }
  if (entries === undefined) {
    return {
      ...base,
      status: 'failed',
      summary: 'Codex MCP listing is invalid',
    }
  }
  const enabled = entries.get(definition.match)
  if (!entries.has(definition.match)) {
    return { ...base, status: 'failed', summary: 'connector is not listed' }
  }
  if (enabled === false) {
    return { ...base, status: 'disabled', summary: 'connector disabled' }
  }
  if (enabled === true) {
    return { ...base, status: 'healthy', summary: 'server enabled' }
  }
  return {
    ...base,
    status: definition.criticality === 'required' ? 'failed' : 'degraded',
    summary: 'connector enabled status is unrecognized',
  }
}
