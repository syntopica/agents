import type { ServicesManifest } from './ServicesManifest'
import type { ServicesPlatform } from './ServicesPlatform'
import type { ServicesState } from './ServicesState'

export interface PlanInput {
  manifest: ServicesManifest
  platform: ServicesPlatform
  state: ServicesState
}
