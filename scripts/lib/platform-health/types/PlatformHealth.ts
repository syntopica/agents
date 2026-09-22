import type { CapabilityHealth } from './CapabilityHealth'
import type { PlatformLifecycle } from './PlatformLifecycle'
import type { ProbeResult } from './ProbeResult'

export interface PlatformHealth {
  registryId: string
  lifecycle: PlatformLifecycle
  probes: ProbeResult[]
  capabilities: CapabilityHealth[]
}
