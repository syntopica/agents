import { CAPABILITY_STATUS_SEVERITY } from './constants/CAPABILITY_STATUS_SEVERITY'
import type { LiveProbeResult } from './types/LiveProbeResult'
import type { PlatformHealth } from './types/PlatformHealth'

export const applyLiveProbe = (
  health: PlatformHealth,
  result: LiveProbeResult,
): PlatformHealth => ({
  ...health,
  capabilities: health.capabilities.map((capability) => {
    if (capability.capability !== result.capability) return capability
    if (
      CAPABILITY_STATUS_SEVERITY[capability.status] >
      CAPABILITY_STATUS_SEVERITY[result.status]
    ) {
      return capability
    }
    return { ...capability, status: result.status, summary: result.summary }
  }),
})
