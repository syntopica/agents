/**
 * Detect if umbrella rule should become a workflow or stay as a rule
 * @param {object} parsed - Parsed MDC with frontmatter and content
 * @param {string} _rulePath - Path to the rule file
 * @returns {object} - { isWorkflow: boolean, content: string }
 */

import type { RuleItem } from '../../types/RuleItem'

export function detectUmbrellaType(parsed: RuleItem, _rulePath: string) {
  const content = parsed.content ?? ''

  const hasSequentialSteps = /(?:step|first|then|next|finally)/i.test(content)

  const hasNumberedList = /^\d+\./m.test(content)

  const referenceCount = (content.match(/\.cursor\/rules\//g) ?? []).length
  const isMainlyReferences = referenceCount > 3
  return {
    isWorkflow: hasSequentialSteps && hasNumberedList && !isMainlyReferences,

    content,
  }
}
