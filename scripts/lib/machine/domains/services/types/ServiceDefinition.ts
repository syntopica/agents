import type { ServiceSchedule } from './ServiceSchedule'

export interface ServiceDefinition {
  name: string
  workingDirectory: string
  command: string
  logPath?: string
  schedule?: ServiceSchedule
  runAtLoad?: boolean
  keepAlive?: boolean
}
