import { formatWindsurfFrontmatter } from '../windsurf/formatters/formatWindsurfFrontmatter'
import { addWindsurfAnnotations } from '../windsurf/transformers/addWindsurfAnnotations'
import { convertToWindsurfReferences } from '../windsurf/transformers/convertToWindsurfReferences'
import type { ToWindsurfRuleParsed } from './types/ToWindsurfRuleParsed'

/**
 * Main conversion function
 * @param {object} parsed - Parsed MDC with frontmatter and content
 * @param {string} _rulePath - Original rule path
 * @returns {string} - Windsurf-formatted rule
 */

export function toWindsurfRule(
  parsed: ToWindsurfRuleParsed,
  _rulePath: string,
) {
  const frontmatter = formatWindsurfFrontmatter(parsed.frontmatter ?? {})

  let content = convertToWindsurfReferences(parsed.content ?? '')

  content = addWindsurfAnnotations(content, parsed.frontmatter ?? {})
  return `${frontmatter}\n\n${content}`
}
