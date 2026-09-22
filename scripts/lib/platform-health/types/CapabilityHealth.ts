import type { CapabilityStatus } from './CapabilityStatus'
import type { PlatformCapability } from './PlatformCapability'

export interface CapabilityHealth {
  capability: PlatformCapability
  status: CapabilityStatus
  summary: string
  findings: string[]
}
