import type { DomainResult } from './DomainResult'

export interface RunReport {
  runId: string
  profile: string
  domains: DomainResult[]
  ok: boolean
}
