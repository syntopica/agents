import type { DomainResult } from '../../types/DomainResult'
import { MACHINE_PROFILES } from '../MACHINE_PROFILES'
import type { MachineProfile } from '../types/MachineProfile'

export const selectProfileDomains = ({
  profile,
  domains,
}: {
  profile: MachineProfile
  domains: DomainResult[]
}): DomainResult[] => {
  const selected: readonly string[] = MACHINE_PROFILES[profile]

  return domains.filter((domain) => selected.includes(domain.domain))
}
