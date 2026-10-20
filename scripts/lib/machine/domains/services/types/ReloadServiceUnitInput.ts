import type { CommandRunner } from '../../../exec/types/CommandRunner'
import type { ServicesPlatform } from './ServicesPlatform'

export interface ReloadServiceUnitInput {
  platform: ServicesPlatform
  unitPath: string
  unitFile: string
  uid: number
  hasTimer: boolean
  run: CommandRunner
}
