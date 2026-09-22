import type { groupByCategoryAndSubcategory } from '../groupers/groupByCategoryAndSubcategory'
import { renderRuleBlock } from './renderRuleBlock'

export function renderGrouped(
  grouped: ReturnType<typeof groupByCategoryAndSubcategory>,
): string {
  const lines: string[] = []
  for (const { category, subgroups } of grouped) {
    lines.push(`## ${category}`)
    lines.push('')

    for (const { subcategory, rules } of subgroups) {
      if (subcategory) {
        lines.push(`### ${subcategory}`)
        lines.push('')
      }

      for (const rule of rules) {
        renderRuleBlock(rule, lines)
      }
    }
  }

  return lines.join('\n')
}
