import type { RuleItem } from '../types/RuleItem'

/**
 * @param {RuleItem} item
 * @returns {string}
 */

export function getActivation(item: RuleItem) {
  const frontmatter = item.frontmatter ?? {}

  if (frontmatter.alwaysApply === true) return 'Always On'

  if (frontmatter.globs && frontmatter.globs.trim() !== '')
    return `Glob: ${frontmatter.globs}`
  return 'Model Decision'
}
