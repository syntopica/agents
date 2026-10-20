import type { ServicesManifestParseResult } from './ServicesManifestParseResult'
import type { ServicesPlatform } from './ServicesPlatform'
import type { ServicesState } from './ServicesState'

export interface ToServicesDomainResultInput {
  parsed: ServicesManifestParseResult | undefined
  platform: ServicesPlatform
  state: ServicesState
}
