import type { ServiceDefinition } from './ServiceDefinition'
import type { ServicesPlatform } from './ServicesPlatform'

export interface RenderServiceUnitsInput {
  service: ServiceDefinition
  platform: ServicesPlatform
}
