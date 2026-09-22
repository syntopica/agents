/**
 * Get Antigravity activation mode from frontmatter
 * @param {object} frontmatter - Parsed MDC frontmatter
 * @returns {string} - Antigravity activation mode
 */

import type { RuleFrontmatter } from '../../types/RuleFrontmatter'

export function getAntigravityActivation(frontmatter?: RuleFrontmatter) {
  const { alwaysApply, globs } = frontmatter ?? {}
  if (alwaysApply === true) {
    return 'Always On'
  }

  if (globs && globs.trim() !== '') {
    return `Glob: ${globs}`
  }

  return 'Model Decision'
}
