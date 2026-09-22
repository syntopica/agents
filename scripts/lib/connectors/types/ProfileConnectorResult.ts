import type { ConnectorProfile } from './ConnectorProfile'
import type { ConnectorStatus } from './ConnectorStatus'

export interface ProfileConnectorResult {
  id: string
  profile: ConnectorProfile
  status: ConnectorStatus
  criticality: 'required' | 'optional'
  boundary: 'client' | 'hosted-connector' | 'access-gateway'
  summary: string
}
