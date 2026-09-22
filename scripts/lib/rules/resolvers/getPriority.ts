import type { RuleItem } from '../types/RuleItem'

/**
 * @param {RuleItem} item
 * @returns {string}
 */

export function getPriority(item: RuleItem) {
  const frontmatter = item.frontmatter ?? {}

  if (frontmatter.alwaysApply === true) return 'high'

  if (frontmatter.globs && frontmatter.globs.trim() !== '') return 'high'
  return 'medium'
}
