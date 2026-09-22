import type { PlatformDefinition } from './PlatformDefinition'

export interface PlatformManifest {
  version: 1
  platforms: PlatformDefinition[]
}
