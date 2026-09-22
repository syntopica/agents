import { collectGuidanceOutputErrors } from '../collectGuidanceOutputErrors'
import { containsSensitiveGuidanceContent } from '../containsSensitiveGuidanceContent'
import { isAllowedDocumentationUrl } from '../isAllowedDocumentationUrl'
import { parseReconciliationResult } from '../parseReconciliationResult'
import { toGuidanceInputHashes } from '../toGuidanceInputHashes'
import type { GuidancePolicy } from '../types/GuidancePolicy'
import type { ReconciliationResult } from '../types/ReconciliationResult'
import { validateReconciliationSchema } from './validateReconciliationSchema'

export const validateReconciliationResult = (
  raw: unknown,
  policy: GuidancePolicy,
  expectedInputHashes: Record<string, string>,
  runStartedAt: Date,
  runEndedAt: Date,
):
  | { ok: true; result: ReconciliationResult }
  | { ok: false; errors: string[] } => {
  const schemaErrors = validateReconciliationSchema(raw)
  if (schemaErrors.length > 0) return { ok: false, errors: schemaErrors }
  const parsed = parseReconciliationResult(raw)
  if (!parsed.ok) return parsed
  const evidenceIsCurrent = (retrievedAt: string): boolean => {
    const timestamp = Date.parse(retrievedAt)
    return (
      Number.isFinite(timestamp) &&
      timestamp >= runStartedAt.getTime() &&
      timestamp <= runEndedAt.getTime()
    )
  }
  const result = parsed.result
  const errors: string[] = []
  const expectedHashes = toGuidanceInputHashes(expectedInputHashes)
  if (JSON.stringify(result.inputHashes) !== JSON.stringify(expectedHashes))
    errors.push('input hashes do not match current sources')
  if (
    !result.documentation.some(
      (item) =>
        item.provider === 'claude' &&
        isAllowedDocumentationUrl(
          item.url,
          policy.officialDocumentationOrigins.claude,
        ) &&
        evidenceIsCurrent(item.retrievedAt),
    )
  )
    errors.push('missing current official Claude documentation evidence')
  if (
    !result.documentation.some(
      (item) =>
        item.provider === 'codex' &&
        isAllowedDocumentationUrl(
          item.url,
          policy.officialDocumentationOrigins.codex,
        ) &&
        evidenceIsCurrent(item.retrievedAt),
    )
  )
    errors.push('missing current official Codex documentation evidence')
  if (containsSensitiveGuidanceContent(JSON.stringify(result)))
    errors.push('result contains secret or captured conversation material')
  errors.push(...collectGuidanceOutputErrors(result, policy))
  return errors.length > 0 ? { ok: false, errors } : { ok: true, result }
}
