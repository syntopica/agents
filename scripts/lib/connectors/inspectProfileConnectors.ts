import { applyCodexStdioProbes } from './applyCodexStdioProbes'
import { probeStdioMcp } from './probeStdioMcp'
import { readProfileConnectorStatus } from './readProfileConnectorStatus'
import { resolveAgentCliExecutable } from './resolveAgentCliExecutable'
import { runClaudeMcpList } from './runClaudeMcpList'
import { runCodexMcpList } from './runCodexMcpList'
import type { CodexStdioProbeTarget } from './types/CodexStdioProbeTarget'
import type { ConnectorDefinition } from './types/ConnectorDefinition'
import type { ConnectorProfile } from './types/ConnectorProfile'

export const inspectProfileConnectors = async (
  profile: ConnectorProfile,
  definitions: ConnectorDefinition[],
  home: string,
  codexStdioTargets: ReadonlyMap<string, CodexStdioProbeTarget> = new Map(),
  listCodex: typeof runCodexMcpList = runCodexMcpList,
  probeStdio: typeof probeStdioMcp = probeStdioMcp,
): Promise<ReturnType<typeof readProfileConnectorStatus>> => {
  const output =
    profile === 'codex'
      ? await listCodex(resolveAgentCliExecutable('codex', home))
      : await runClaudeMcpList(
          profile,
          home,
          resolveAgentCliExecutable('claude', home),
        )
  const results = readProfileConnectorStatus(output, profile, definitions)
  return profile === 'codex'
    ? applyCodexStdioProbes(results, codexStdioTargets, probeStdio)
    : results
}
