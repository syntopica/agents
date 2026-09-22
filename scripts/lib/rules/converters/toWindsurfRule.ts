import { formatWindsurfFrontmatter } from '../windsurf/formatters/formatWindsurfFrontmatter'
import { addWindsurfAnnotations } from '../windsurf/transformers/addWindsurfAnnotations'
import { convertToWindsurfReferences } from '../windsurf/transformers/convertToWindsurfReferences'

/**
 * Main conversion function
 * @param {object} parsed - Parsed MDC with frontmatter and content
 * @param {string} _rulePath - Original rule path
 * @returns {string} - Windsurf-formatted rule
 */

import type { RuleFrontmatter } from '../types/RuleFrontmatter'

export function toWindsurfRule(
  parsed: {
    content?: string
    frontmatter?: RuleFrontmatter | null
  },
  _rulePath: string,
) {
  const frontmatter = formatWindsurfFrontmatter(parsed.frontmatter ?? {})

  let content = convertToWindsurfReferences(parsed.content ?? '')

  content = addWindsurfAnnotations(content, parsed.frontmatter ?? {})
  return `${frontmatter}\n\n${content}`
}
