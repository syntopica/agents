import type { ServicesManifest } from '../types/ServicesManifest'
import { createServiceDefinition } from './createServiceDefinition'

export const createServicesManifest = (): ServicesManifest => ({
  version: 1,
  services: [createServiceDefinition()],
})
