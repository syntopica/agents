import { probeStdioMcp } from './probeStdioMcp'
import type { CodexStdioProbeTarget } from './types/CodexStdioProbeTarget'
import type { ProfileConnectorResult } from './types/ProfileConnectorResult'

export const applyCodexStdioProbes = async (
  results: ProfileConnectorResult[],
  targets: ReadonlyMap<string, CodexStdioProbeTarget>,
  probe: typeof probeStdioMcp = probeStdioMcp,
): Promise<ProfileConnectorResult[]> =>
  Promise.all(
    results.map(async (result) => {
      const target = targets.get(result.id)
      if (result.status !== 'healthy' || target === undefined) return result

      try {
        const probed = await probe(
          target.command,
          target.args,
          target.timeoutMs,
        )
        return probed.status === 'healthy'
          ? {
              ...result,
              summary:
                'server enabled; MCP initialize and tools/list succeeded',
            }
          : {
              ...result,
              status: 'failed' as const,
              summary: 'required MCP initialize and tools/list probe failed',
            }
      } catch {
        return {
          ...result,
          status: 'failed' as const,
          summary: 'required MCP initialize and tools/list probe failed',
        }
      }
    }),
  )
