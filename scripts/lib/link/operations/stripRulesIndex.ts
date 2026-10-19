import { RULES_INDEX_END } from '../../../constants/RULES_INDEX_END'
import { RULES_INDEX_HEADING } from '../../../constants/RULES_INDEX_HEADING'
import { RULES_INDEX_START } from '../../../constants/RULES_INDEX_START'

/**
 * A SKILL.md without the rules index the compiler generates, so a compiled
 * copy can be compared with its source.
 */
export const stripRulesIndex = (content: string) => {
  const startIdx = content.indexOf(RULES_INDEX_START)
  const endIdx = content.indexOf(RULES_INDEX_END)
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    return content.trim()
  }
  const headingIdx = content.lastIndexOf(RULES_INDEX_HEADING, startIdx)
  const cutFrom = headingIdx === -1 ? startIdx : headingIdx
  const before = content.slice(0, cutFrom).trimEnd()
  const after = content.slice(endIdx + RULES_INDEX_END.length).trimStart()
  return (after.length > 0 ? `${before}\n${after}` : before).trim()
}
