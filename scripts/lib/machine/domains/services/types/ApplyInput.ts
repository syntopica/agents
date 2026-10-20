import type { CommandRunner } from '../../../exec/types/CommandRunner'
import type { ServicesManifest } from './ServicesManifest'
import type { ServicesPaths } from './ServicesPaths'
import type { ServicesState } from './ServicesState'

export interface ApplyInput {
  manifest: ServicesManifest
  paths: ServicesPaths
  state: ServicesState
  uid: number
  run: CommandRunner
}
