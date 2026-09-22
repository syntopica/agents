import type { RuleItem } from './RuleItem'

export interface RenderIndexOnlyOptions {
  format?: string
  maxChars?: number
  onLimit?: 'truncate' | 'error'
  includeShortSummary?: boolean
  referencePrefix?: string
  title?: string
  headerIntro?: string
  embedContent?: string
  getRuleRef?: (item: RuleItem) => string
  getRuleBadges?: (item: RuleItem) => string[]
}
