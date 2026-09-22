import { convertToAntigravityMentions } from '../antigravity/transformers/convertToAntigravityMentions'
import { detectUmbrellaType } from '../antigravity/transformers/detectUmbrellaType'
import { generateAntigravityHeader } from '../antigravity/transformers/generateAntigravityHeader'
import { getAntigravityActivation } from '../antigravity/transformers/getAntigravityActivation'
import { splitForAntigravity } from '../antigravity/transformers/splitForAntigravity'
import type { RuleItem } from '../types/RuleItem'

/**
 * Main conversion function
 * @param {object} parsed - Parsed MDC with frontmatter and content
 * @param {string} rulePath - Original rule path
 * @returns {Array<{name: string, content: string, isWorkflow: boolean}>}
 */

export function toAntigravityRule(parsed: RuleItem, rulePath: string) {
  const activation = getAntigravityActivation(parsed.frontmatter)

  const header = generateAntigravityHeader(parsed.frontmatter, activation)

  const content = convertToAntigravityMentions(parsed.content ?? '', rulePath)
  const umbrellaInfo = detectUmbrellaType(parsed, rulePath)
  const fullContent = header + content
  const ruleName = rulePath.replace(/\.mdc$/, '').replace(/\//g, '-')
  const parts = splitForAntigravity(fullContent, ruleName)

  return parts.map((part) => ({
    ...part,
    isWorkflow: umbrellaInfo.isWorkflow,
  }))
}
