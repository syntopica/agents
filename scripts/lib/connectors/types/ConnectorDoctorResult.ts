import type { ProfileConnectorResult } from './ProfileConnectorResult'

export interface ConnectorDoctorResult {
  exitCode: 0 | 1 | 2
  output:
    | { ok: false; errors: string[] }
    | { ok: boolean; connectors: ProfileConnectorResult[] }
}
