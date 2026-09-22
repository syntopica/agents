/**
 * Generate Antigravity rule metadata header
 * @param {object} frontmatter - Parsed frontmatter
 * @param {string} activation - Activation mode
 * @returns {string} - Formatted metadata
 */
import type { RuleFrontmatter } from '../../types/RuleFrontmatter'

export function generateAntigravityHeader(
  frontmatter: RuleFrontmatter | undefined,
  activation: string,
) {
  const { description } = frontmatter ?? {}
  const descStr =
    typeof description === 'string' ? description : 'No description'
  return `<!-- Antigravity Rule
Activation: ${activation}
Description: ${descStr}
-->\n\n`
}
