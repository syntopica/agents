import type { CapabilityStatus } from './CapabilityStatus'
import type { PlatformCapability } from './PlatformCapability'

export interface LiveProbeResult {
  platformId: string
  capability: PlatformCapability
  status: CapabilityStatus
  summary: string
  timedOut: boolean
  exitCode: number | null
}
