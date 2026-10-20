import type { ServicesManifestParseResult } from './ServicesManifestParseResult'
import type { ServicesPaths } from './ServicesPaths'

export interface ResolveDeclaredUnitPathsInput {
  parsed: ServicesManifestParseResult | undefined
  paths: ServicesPaths
}
