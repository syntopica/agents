import { RULES_INDEX_END } from '../constants/RULES_INDEX_END'
import { RULES_INDEX_HEADING } from '../constants/RULES_INDEX_HEADING'
import { RULES_INDEX_START } from '../constants/RULES_INDEX_START'
import { renderRulesIndex } from './renderRulesIndex'

export const upsertRulesIndex = (content: string, rules: string[]) => {
  const rendered = renderRulesIndex(rules)
  const startIdx = content.indexOf(RULES_INDEX_START)
  const endIdx = content.indexOf(RULES_INDEX_END)

  if (startIdx !== -1 || endIdx !== -1) {
    if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
      throw new Error('Malformed generated rules index markers in SKILL.md')
    }

    const headingIdx = content.lastIndexOf(RULES_INDEX_HEADING, startIdx)
    if (headingIdx === -1) {
      throw new Error('Rules index markers found without heading in SKILL.md')
    }

    const afterEnd = endIdx + RULES_INDEX_END.length
    const before = content.slice(0, headingIdx).trimEnd()
    const after = content.slice(afterEnd).trimStart()

    const afterPart = after.length > 0 ? '\n' + after : ''
    return `${before}\n\n${rendered}${afterPart}`
  }

  const base = content.trimEnd()
  return `${base}\n\n${rendered}`
}
