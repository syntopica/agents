import type { CommandRunner } from '../../../exec/types/CommandRunner'
import type { ServicesManifestParseResult } from './ServicesManifestParseResult'
import type { ServicesPaths } from './ServicesPaths'

export interface RunServicesApplyInput {
  parsed: ServicesManifestParseResult | undefined
  paths: ServicesPaths
  uid: number
  run: CommandRunner
}
