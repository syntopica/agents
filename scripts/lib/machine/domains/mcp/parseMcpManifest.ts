import { findCredentialLiterals } from '../../schemas/findCredentialLiterals'
import { collectRequiredErrors } from './collectRequiredErrors'
import { collectStartupTimeoutErrors } from './collectStartupTimeoutErrors'
import { collectTargetErrors } from './collectTargetErrors'
import { collectToolApprovalModeErrors } from './collectToolApprovalModeErrors'
import { collectTransportErrors } from './collectTransportErrors'
import type { McpManifest } from './types/McpManifest'
import type { ParseResult } from './types/ParseResult'

export const parseMcpManifest = (raw: unknown): ParseResult => {
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, errors: ['manifest must be an object'] }
  }

  const servers = (raw as Record<string, unknown>)['servers']
  if (typeof servers !== 'object' || servers === null) {
    return { ok: false, errors: ['manifest.servers must be an object'] }
  }

  const errors: string[] = []

  for (const [name, value] of Object.entries(servers)) {
    if (typeof value !== 'object' || value === null) {
      errors.push(`${name}: server must be an object`)
      continue
    }

    const server = value as Record<string, unknown>
    collectTargetErrors(name, server['targets'], errors)
    collectTransportErrors(name, server, errors)
    collectStartupTimeoutErrors(name, server['startup_timeout_sec'], errors)
    collectRequiredErrors(name, server['required'], errors)
    collectToolApprovalModeErrors(
      name,
      server['default_tools_approval_mode'],
      errors,
    )

    for (const finding of findCredentialLiterals(server)) {
      errors.push(`${name}: ${finding}`)
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  return { ok: true, manifest: raw as McpManifest }
}
