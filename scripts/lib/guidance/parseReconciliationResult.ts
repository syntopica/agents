import { findUnknownReconciliationResultProperties } from './findUnknownReconciliationResultProperties'
import { isRecord } from './isRecord'
import { parseGuidanceInputHashes } from './parseGuidanceInputHashes'
import type { DocumentationEvidence } from './types/DocumentationEvidence'
import type { GuidanceDecision } from './types/GuidanceDecision'
import type { ReconciliationResult } from './types/ReconciliationResult'

export const parseReconciliationResult = (
  raw: unknown,
):
  | { ok: true; result: ReconciliationResult }
  | { ok: false; errors: string[] } => {
  if (!isRecord(raw)) return { ok: false, errors: ['result must be an object'] }
  const isEvidence = (value: unknown): boolean =>
    isRecord(value) &&
    Object.keys(value).every((key) =>
      ['provider', 'url', 'retrievedAt'].includes(key),
    ) &&
    (value['provider'] === 'claude' || value['provider'] === 'codex') &&
    typeof value['url'] === 'string' &&
    typeof value['retrievedAt'] === 'string' &&
    !Number.isNaN(Date.parse(value['retrievedAt']))
  const isDecision = (value: unknown): boolean =>
    isRecord(value) &&
    Object.keys(value).every((key) =>
      ['action', 'source', 'rationale'].includes(key),
    ) &&
    ['promoted', 'preserved', 'translated', 'removed'].includes(
      String(value['action']),
    ) &&
    ['shared', 'claude', 'codex', 'rule'].includes(String(value['source'])) &&
    typeof value['rationale'] === 'string' &&
    value['rationale'].trim() !== ''
  const errors = findUnknownReconciliationResultProperties(raw)
  if (raw['version'] !== 1) errors.push('version must be 1')
  const parsedInputHashes = parseGuidanceInputHashes(raw['inputHashes'])
  errors.push(...(parsedInputHashes.ok ? [] : [parsedInputHashes.error]))
  for (const key of [
    'shared',
    'claudeOverlay',
    'codexOverlay',
    'claudeDocument',
    'codexDocument',
  ] as const)
    if (typeof raw[key] !== 'string' || raw[key].trim() === '')
      errors.push(`${key} must be non-empty text`)
  if (
    !Array.isArray(raw['documentation']) ||
    raw['documentation'].length === 0 ||
    !raw['documentation'].every(isEvidence)
  )
    errors.push('documentation entries are invalid')
  if (!Array.isArray(raw['decisions']) || !raw['decisions'].every(isDecision))
    errors.push('decisions are invalid')
  for (const key of ['warnings', 'unresolvedLimitations'] as const)
    if (
      !Array.isArray(raw[key]) ||
      !raw[key].every((item) => typeof item === 'string')
    )
      errors.push(`${key} must be a string array`)
  if (errors.length > 0) return { ok: false, errors }
  return {
    ok: true,
    result: {
      version: 1,
      inputHashes: parsedInputHashes.ok ? parsedInputHashes.inputHashes : [],
      shared: raw['shared'] as string,
      claudeOverlay: raw['claudeOverlay'] as string,
      codexOverlay: raw['codexOverlay'] as string,
      claudeDocument: raw['claudeDocument'] as string,
      codexDocument: raw['codexDocument'] as string,
      documentation: raw['documentation'] as DocumentationEvidence[],
      decisions: raw['decisions'] as GuidanceDecision[],
      warnings: raw['warnings'] as string[],
      unresolvedLimitations: raw['unresolvedLimitations'] as string[],
    },
  }
}
