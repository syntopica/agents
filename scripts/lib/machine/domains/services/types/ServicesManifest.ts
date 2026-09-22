import type { ServiceDefinition } from './ServiceDefinition'

export interface ServicesManifest {
  version: 1
  services: ServiceDefinition[]
}
