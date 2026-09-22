import { readClaudeConnectorStatus } from './readClaudeConnectorStatus'
import { readCodexConnectorStatus } from './readCodexConnectorStatus'
import type { ConnectorDefinition } from './types/ConnectorDefinition'
import type { ConnectorProfile } from './types/ConnectorProfile'
import type { ProfileConnectorResult } from './types/ProfileConnectorResult'

export const readProfileConnectorStatus = (
  output: string,
  profile: ConnectorProfile,
  definitions: ConnectorDefinition[],
): ProfileConnectorResult[] =>
  profile === 'codex'
    ? readCodexConnectorStatus(output, definitions)
    : readClaudeConnectorStatus(output, profile, definitions)
