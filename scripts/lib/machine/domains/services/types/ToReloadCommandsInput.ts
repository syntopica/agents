import type { ServicesPlatform } from './ServicesPlatform'

export interface ToReloadCommandsInput {
  platform: ServicesPlatform
  unitPath: string
  unitFile: string
  uid: number
  hasTimer: boolean
}
