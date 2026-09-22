import type { GuidanceOutputDocuments } from './types/GuidanceOutputDocuments'
import type { GuidancePolicy } from './types/GuidancePolicy'
import { validateClaudeTargetSyntax } from './validators/validateClaudeTargetSyntax'
import { validateCodexTargetSyntax } from './validators/validateCodexTargetSyntax'

export const collectGuidanceOutputErrors = (
  documents: GuidanceOutputDocuments,
  policy: GuidancePolicy,
): string[] => {
  const errors: string[] = []
  errors.push(...validateClaudeTargetSyntax(documents.claudeDocument))
  errors.push(...validateCodexTargetSyntax(documents.codexDocument))
  for (const invariant of policy.requiredInvariants) {
    if (!documents.shared.includes(invariant))
      errors.push(
        `required invariant is missing from canonical shared guidance: ${invariant}`,
      )
    if (
      !documents.claudeDocument.includes(invariant) ||
      !documents.codexDocument.includes(invariant)
    )
      errors.push(
        `required invariant is missing from a rendered document: ${invariant}`,
      )
  }
  const outputs = [
    documents.shared,
    documents.claudeOverlay,
    documents.codexOverlay,
    documents.claudeDocument,
    documents.codexDocument,
  ]
  if (
    outputs.some(
      (document) => Buffer.byteLength(document, 'utf8') > policy.maxOutputBytes,
    )
  )
    errors.push('result exceeds configured output byte limit')
  return errors
}
