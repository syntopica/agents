import type { ReconciliationResult } from './ReconciliationResult'

export type GuidanceOutputDocuments = Pick<
  ReconciliationResult,
  | 'shared'
  | 'claudeOverlay'
  | 'codexOverlay'
  | 'claudeDocument'
  | 'codexDocument'
>
