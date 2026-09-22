import type { ParseResult } from '../../machine/domains/mcp/types/ParseResult'
import type { CodexStdioProbeTarget } from './CodexStdioProbeTarget'
import type { ConnectorDefinition } from './ConnectorDefinition'
import type { ConnectorManifestParseResult } from './ConnectorManifestParseResult'
import type { ConnectorProfile } from './ConnectorProfile'
import type { ProfileConnectorResult } from './ProfileConnectorResult'

export interface ConnectorDoctorInput {
  parsed: ConnectorManifestParseResult
  parsedMcp: ParseResult
  requestedProfile: string | undefined
  home: string
  env: NodeJS.ProcessEnv
  inspect: (
    profile: ConnectorProfile,
    definitions: ConnectorDefinition[],
    home: string,
    codexStdioTargets: ReadonlyMap<string, CodexStdioProbeTarget>,
  ) => Promise<ProfileConnectorResult[]>
}
