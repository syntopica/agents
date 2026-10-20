import type { ServicesManifest } from './ServicesManifest'
import type { ServicesPlatform } from './ServicesPlatform'
import type { ServicesState } from './ServicesState'

export interface CollectDriftedUnitsInput {
  manifest: ServicesManifest
  platform: ServicesPlatform
  state: ServicesState
}
