import type { DomainResult } from '../../types/DomainResult'
import { plan } from './plan'
import type { PluginsManifestParseResult } from './types/PluginsManifestParseResult'
import type { PluginsState } from './types/PluginsState'

export const toPluginsDomainResult = ({
  parsed,
  state,
}: {
  parsed: PluginsManifestParseResult | undefined
  state: PluginsState
}): DomainResult => {
  if (parsed === undefined) {
    return {
      domain: 'plugins',
      status: 'skipped',
      changes: 0,
      messages: ['no plugins.json in the instance directory'],
    }
  }

  if (!parsed.ok) {
    return {
      domain: 'plugins',
      status: 'failed',
      changes: 0,
      messages: parsed.errors,
    }
  }

  const changes = plan({ manifest: parsed.manifest, state })

  return {
    domain: 'plugins',
    status: changes.length === 0 ? 'converged' : 'changed',
    changes: changes.length,
    messages: changes.map(
      (change) => `${change.operation} ${change.id} (${change.detail})`,
    ),
  }
}
