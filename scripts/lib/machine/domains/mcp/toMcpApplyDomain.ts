import type { DomainResult } from '../../types/DomainResult'

/**
 * An unresolved secret reference is not a failure: the run wrote what it could
 * and reports which environment references the machine still has to provide.
 */
export const toMcpApplyDomain = ({
  written,
  targets,
  missing,
}: {
  written: number
  targets: number
  missing: string[]
}): DomainResult => {
  if (missing.length > 0) {
    return {
      domain: 'mcp',
      status: 'needs-secret',
      changes: written,
      messages: [`unresolved secret references: ${missing.join(', ')}`],
    }
  }

  return {
    domain: 'mcp',
    status: 'changed',
    changes: written,
    messages: [
      `wrote ${String(written)} server entries across ${String(targets)} targets`,
    ],
  }
}
