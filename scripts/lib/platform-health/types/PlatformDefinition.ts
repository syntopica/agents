import type { PlatformCapability } from './PlatformCapability'
import type { PlatformProbe } from './PlatformProbe'

export interface PlatformDefinition {
  registryId: string
  capabilities: PlatformCapability[]
  probe: PlatformProbe
}
