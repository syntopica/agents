import { collectGuidancePolicyPathErrors } from './collectGuidancePolicyPathErrors'
import { containsSensitiveGuidanceContent } from './containsSensitiveGuidanceContent'
import { isRecord } from './isRecord'
import type { GuidancePolicy } from './types/GuidancePolicy'

export const parseGuidancePolicy = (
  raw: unknown,
): { ok: true; policy: GuidancePolicy } | { ok: false; errors: string[] } => {
  if (!isRecord(raw)) return { ok: false, errors: ['policy must be an object'] }
  const policyKeys = new Set([
    'version',
    'requiredInvariants',
    'officialDocumentationOrigins',
    'maxOutputBytes',
    'agentCommand',
    'agentReadAllowlist',
    'agentBootstrapFiles',
    'timeoutMs',
  ])
  const isHttpsOrigin = (value: string): boolean => {
    try {
      const parsed = new URL(value)
      return (
        parsed.protocol === 'https:' &&
        parsed.origin === value &&
        parsed.pathname === '/'
      )
    } catch {
      return false
    }
  }
  const errors: string[] = []
  for (const key of Object.keys(raw))
    if (!policyKeys.has(key)) errors.push(`unknown property: ${key}`)
  const invariants = raw['requiredInvariants']
  const origins = raw['officialDocumentationOrigins']
  const command = raw['agentCommand']
  const readAllowlist = raw['agentReadAllowlist']
  const bootstrapFiles = raw['agentBootstrapFiles']
  if (raw['version'] !== 1) errors.push('version must be 1')
  if (
    !Array.isArray(invariants) ||
    invariants.length === 0 ||
    !invariants.every((item) => typeof item === 'string' && item.trim() !== '')
  )
    errors.push('requiredInvariants must be a non-empty string array')
  if (
    !isRecord(origins) ||
    !['claude', 'codex'].every(
      (provider) =>
        Array.isArray(origins[provider]) &&
        origins[provider].length > 0 &&
        origins[provider].every(
          (item) => typeof item === 'string' && isHttpsOrigin(item),
        ),
    ) ||
    Object.keys(origins).some(
      (provider) => provider !== 'claude' && provider !== 'codex',
    )
  )
    errors.push(
      'officialDocumentationOrigins must provide Claude and Codex HTTPS origins',
    )
  if (
    typeof raw['maxOutputBytes'] !== 'number' ||
    !Number.isSafeInteger(raw['maxOutputBytes']) ||
    raw['maxOutputBytes'] < 1024 ||
    raw['maxOutputBytes'] > 1_048_576
  )
    errors.push('maxOutputBytes must be between 1024 and 1048576')
  if (
    !Array.isArray(command) ||
    command.length === 0 ||
    !command.every(
      (item) =>
        typeof item === 'string' && item !== '' && !/[\r\n\0]/u.test(item),
    )
  )
    errors.push('agentCommand must be a non-empty argument array')
  errors.push(...collectGuidancePolicyPathErrors(readAllowlist, bootstrapFiles))
  if (
    typeof raw['timeoutMs'] !== 'number' ||
    !Number.isSafeInteger(raw['timeoutMs']) ||
    raw['timeoutMs'] < 1000 ||
    raw['timeoutMs'] > 300_000
  )
    errors.push('timeoutMs must be between 1000 and 300000')
  if (containsSensitiveGuidanceContent(JSON.stringify(raw)))
    errors.push('policy contains a credential literal')
  return errors.length > 0
    ? { ok: false, errors }
    : { ok: true, policy: raw as unknown as GuidancePolicy }
}
