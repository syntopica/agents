import type { DomainResult } from '../../../types/DomainResult'
import type { MachineProfile } from '../../types/MachineProfile'

export interface SelectProfileDomainsInput {
  profile: MachineProfile
  domains: DomainResult[]
}
