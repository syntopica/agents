import { parseCodexMcpListEntries } from './parseCodexMcpListEntries'
import { readCodexConnectorResult } from './readCodexConnectorResult'
import type { ConnectorDefinition } from './types/ConnectorDefinition'
import type { ProfileConnectorResult } from './types/ProfileConnectorResult'

export const readCodexConnectorStatus = (
  output: string,
  definitions: ConnectorDefinition[],
): ProfileConnectorResult[] => {
  const entries = parseCodexMcpListEntries(output)
  return definitions
    .filter(({ profiles }) => profiles.includes('codex'))
    .map((definition) => readCodexConnectorResult(definition, entries))
}
