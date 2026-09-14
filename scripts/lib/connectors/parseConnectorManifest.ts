import { findSecurityCredentialLiterals } from '../machine/domains/security/findSecurityCredentialLiterals'
import { collectConnectorDefinitionErrors } from './collectConnectorDefinitionErrors'
import type { ConnectorDefinition } from './types/ConnectorDefinition'
import type { ConnectorManifestParseResult } from './types/ConnectorManifestParseResult'

export const parseConnectorManifest = (
  raw: unknown,
): ConnectorManifestParseResult => {
  const errors = findSecurityCredentialLiterals(raw)
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { ok: false, errors: [...errors, 'manifest must be an object'] }
  }
  const candidate = raw as Record<string, unknown>
  if (candidate['version'] !== 1) errors.push('version must be 1')
  if (!Array.isArray(candidate['connectors'])) {
    errors.push('connectors must be an array')
    return { ok: false, errors }
  }

  const ids = new Set<string>()
  for (const [index, value] of candidate['connectors'].entries()) {
    errors.push(...collectConnectorDefinitionErrors(value, index, ids))
  }

  return errors.length === 0
    ? {
        ok: true,
        manifest: candidate as unknown as {
          version: 1
          connectors: ConnectorDefinition[]
        },
      }
    : {
        ok: false,
        errors: errors.toSorted((left, right) => left.localeCompare(right)),
      }
}
