import type { DomainResult } from '../../types/DomainResult'
import { plan } from './plan'
import type { ServicesManifestParseResult } from './types/ServicesManifestParseResult'
import type { ServicesPlatform } from './types/ServicesPlatform'
import type { ServicesState } from './types/ServicesState'

export const toServicesDomainResult = ({
  parsed,
  platform,
  state,
}: {
  parsed: ServicesManifestParseResult | undefined
  platform: ServicesPlatform
  state: ServicesState
}): DomainResult => {
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
