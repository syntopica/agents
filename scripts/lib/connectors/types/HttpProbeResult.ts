import type { ConnectorStatus } from './ConnectorStatus'

export interface HttpProbeResult {
  status: ConnectorStatus
  boundary: 'target' | 'network'
  httpCode?: number
  retryAfterSeconds?: number
  durationMs: number
  summary: string
}
