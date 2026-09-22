import type { CapabilityInspectionPaths } from './CapabilityInspectionPaths'
import type { PlatformDefinition } from './PlatformDefinition'
import type { PlatformRuntimeState } from './PlatformRuntimeState'

export interface PlatformInspectionInput {
  definition: PlatformDefinition
  runtime: PlatformRuntimeState
  paths: CapabilityInspectionPaths
}
