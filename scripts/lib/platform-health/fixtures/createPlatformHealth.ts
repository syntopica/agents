import type { CapabilityStatus } from '../types/CapabilityStatus'
import type { PlatformHealth } from '../types/PlatformHealth'

export const createPlatformHealth = (
  lifecycle: PlatformHealth['lifecycle'],
  status: CapabilityStatus,
): PlatformHealth => ({
  registryId: 'test',
  lifecycle,
  probes: [],
  capabilities: [{ capability: 'mcp', status, summary: 'test', findings: [] }],
})
