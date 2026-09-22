import { collectClaudeSecurityErrors } from './collectClaudeSecurityErrors'
import { collectCodexSecurityErrors } from './collectCodexSecurityErrors'
import { findSecurityCredentialLiterals } from './findSecurityCredentialLiterals'
import type { SecurityManifest } from './types/SecurityManifest'
import type { SecurityManifestParseResult } from './types/SecurityManifestParseResult'

export const parseSecurityManifest = (
  raw: unknown,
): SecurityManifestParseResult => {
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, errors: ['manifest must be an object'] }
  }
  const manifest = raw as Record<string, unknown>
  const errors = findSecurityCredentialLiterals(raw)
  for (const key of Object.keys(manifest)) {
    if (!new Set(['version', 'claude', 'codex']).has(key)) {
      errors.push(`manifest.${key} is not supported`)
    }
  }
  if (manifest['version'] !== 1) errors.push('manifest.version must be 1')
  collectClaudeSecurityErrors(manifest['claude'], errors)
  collectCodexSecurityErrors(manifest['codex'], errors)
  return errors.length === 0
    ? { ok: true, manifest: raw as SecurityManifest }
    : {
        ok: false,
        errors: errors.toSorted((left, right) => left.localeCompare(right)),
      }
}
