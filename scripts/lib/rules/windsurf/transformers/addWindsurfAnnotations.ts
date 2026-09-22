import type { RuleFrontmatter } from '../../types/RuleFrontmatter'

/**
 * Add Windsurf-specific annotations
 * @param {string} content - Rule content
 * @param {RuleFrontmatter} frontmatter - Parsed frontmatter
 * @returns {string} - Content with Windsurf annotations
 */

export function addWindsurfAnnotations(
  content: string,
  frontmatter: RuleFrontmatter,
) {
  let annotated = content

  if (frontmatter.globs) {
    const fileTypes = frontmatter.globs.split(',').map((g: string) => g.trim())

    annotated = `<!-- Windsurf Context: ${fileTypes.join(', ')} -->\n\n${annotated}`
  }

  return annotated
}
