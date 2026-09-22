import type { MachineStatus } from './MachineStatus'

export interface DomainResult {
  domain: string
  status: MachineStatus
  changes: number
  messages: string[]
}
