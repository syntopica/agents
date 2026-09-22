import { containsSensitiveGuidanceContent } from './containsSensitiveGuidanceContent'
import type { GuidanceDocumentContents } from './types/GuidanceDocumentContents'
import type { GuidancePolicy } from './types/GuidancePolicy'
import { validateClaudeTargetSyntax } from './validators/validateClaudeTargetSyntax'
import { validateCodexTargetSyntax } from './validators/validateCodexTargetSyntax'

export const collectGuidanceDocumentFindings = (
  contents: GuidanceDocumentContents,
  policy?: GuidancePolicy,
): string[] => {
  const findings: string[] = []
  for (const invariant of policy?.requiredInvariants ?? [])
    for (const name of ['shared', 'claudeDocument', 'codexDocument'] as const) {
      const content = contents[name]
      if (content !== undefined && !content.includes(invariant))
        findings.push(`required invariant missing from ${name}: ${invariant}`)
    }
  if (contents.claudeDocument !== undefined)
    findings.push(...validateClaudeTargetSyntax(contents.claudeDocument))
  if (contents.codexDocument !== undefined)
    findings.push(...validateCodexTargetSyntax(contents.codexDocument))
  if (
    Object.values(contents)
      .filter((value) => value !== undefined)
      .some(containsSensitiveGuidanceContent)
  )
    findings.push(
      'guidance contains credential or captured conversation material',
    )
  return findings
}
