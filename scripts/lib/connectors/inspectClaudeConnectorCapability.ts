import type { LiveProbeResult } from '../platform-health/types/LiveProbeResult'
import { connectorResultsStatus } from './connectorResultsStatus'
import { inspectProfileConnectors } from './inspectProfileConnectors'
import type { ConnectorDefinition } from './types/ConnectorDefinition'

export const inspectClaudeConnectorCapability = async (
  definitions: ConnectorDefinition[],
  home: string,
): Promise<LiveProbeResult> => {
  const results = (
    await Promise.all(
      (['claude-personal', 'claude-secondary'] as const).map((profile) =>
        inspectProfileConnectors(profile, definitions, home),
      ),
    )
  ).flat()
  const status = connectorResultsStatus(results)
  const unhealthy = results.filter(
    ({ status: resultStatus }) => resultStatus !== 'healthy',
  ).length
  return {
    platformId: 'claude',
    capability: 'mcp',
    status,
    summary: `${String(results.length - unhealthy)}/${String(results.length)} profile connectors healthy`,
    timedOut: false,
    exitCode: 0,
  }
}
