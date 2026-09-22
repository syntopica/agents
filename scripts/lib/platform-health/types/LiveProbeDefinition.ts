import type { PlatformCapability } from './PlatformCapability'

export interface LiveProbeDefinition {
  platformId: string
  capability: PlatformCapability
  command: string
  args: string[]
  timeoutMs: number
}
