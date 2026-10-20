import type { DomainResult } from '../../types/DomainResult'
import { plan } from './plan'
import type { ToServicesDomainResultInput } from './types/ToServicesDomainResultInput'

export const toServicesDomainResult = ({
  parsed,
  platform,
  state,
}: ToServicesDomainResultInput): DomainResult => {
  if (parsed === undefined) {
    return {
      domain: 'services',
      status: 'skipped',
      changes: 0,
      messages: ['no services.json in the instance directory'],
    }
  }

  if (!parsed.ok) {
    return {
      domain: 'services',
      status: 'failed',
      changes: 0,
      messages: parsed.errors,
    }
  }

  const changes = plan({ manifest: parsed.manifest, platform, state })

  return {
    domain: 'services',
    status: changes.length === 0 ? 'converged' : 'changed',
    changes: changes.length,
    messages: changes.map(
      (change) => `${change.operation} ${change.file} for ${change.name}`,
    ),
  }
}
