import type { DomainResult } from '../../types/DomainResult'
import { MACHINE_PROFILES } from '../MACHINE_PROFILES'
import type { SelectProfileDomainsInput } from './types/SelectProfileDomainsInput'

export const selectProfileDomains = ({
  profile,
  domains,
}: SelectProfileDomainsInput): DomainResult[] => {
  const selected: readonly string[] = MACHINE_PROFILES[profile]

  return domains.filter((domain) => selected.includes(domain.domain))
}
