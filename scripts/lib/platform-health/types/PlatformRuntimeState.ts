import type { PlatformLifecycle } from './PlatformLifecycle'
import type { ProbeResult } from './ProbeResult'

export interface PlatformRuntimeState {
  registryId: string
  lifecycle: PlatformLifecycle
  probes: ProbeResult[]
}
