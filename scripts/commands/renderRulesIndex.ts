import { RULES_INDEX_END } from '../constants/RULES_INDEX_END'
import { RULES_INDEX_HEADING } from '../constants/RULES_INDEX_HEADING'
import { RULES_INDEX_START } from '../constants/RULES_INDEX_START'

export const renderRulesIndex = (rules: string[]) => {
  const lines = [
    RULES_INDEX_HEADING,
    RULES_INDEX_START,
    ...rules.map((rule: string) => `- ${rule}`),
    RULES_INDEX_END,
  ]

  return `${lines.join('\n')}\n`
}
