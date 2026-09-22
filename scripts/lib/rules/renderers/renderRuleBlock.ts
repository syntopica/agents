import type { RuleItem } from '../types/RuleItem'

export const renderRuleBlock = (rule: RuleItem, lines: string[]) => {
  if (!rule.content) return

  lines.push(`#### ${rule.rel}`)
  lines.push('')
  lines.push('```mdc')
  lines.push(rule.content)

  if (!rule.content.endsWith('\n')) lines.push('')
  lines.push('```')
  lines.push('')
}
