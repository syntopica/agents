import type { DocumentationEvidence } from './DocumentationEvidence'
import type { GuidanceDecision } from './GuidanceDecision'
import type { GuidanceInputHash } from './GuidanceInputHash'

export interface ReconciliationResult {
  version: 1
  inputHashes: GuidanceInputHash[]
  shared: string
  claudeOverlay: string
  codexOverlay: string
  claudeDocument: string
  codexDocument: string
  documentation: DocumentationEvidence[]
  decisions: GuidanceDecision[]
  warnings: string[]
  unresolvedLimitations: string[]
}
