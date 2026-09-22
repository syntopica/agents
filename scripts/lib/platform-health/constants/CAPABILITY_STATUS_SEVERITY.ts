import type { CapabilityStatus } from '../types/CapabilityStatus'

export const CAPABILITY_STATUS_SEVERITY: Record<CapabilityStatus, number> = {
  'not-applicable': 0,
  unsupported: 1,
  healthy: 2,
  'auth-required': 3,
  degraded: 4,
  failed: 5,
}
