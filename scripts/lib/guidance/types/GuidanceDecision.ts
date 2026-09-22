export interface GuidanceDecision {
  action: 'promoted' | 'preserved' | 'translated' | 'removed'
  source: 'shared' | 'claude' | 'codex' | 'rule'
  rationale: string
}
