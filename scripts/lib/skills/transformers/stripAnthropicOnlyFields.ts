import { ANTHROPIC_ONLY_FRONTMATTER_FIELDS } from '../constants/ANTHROPIC_ONLY_FRONTMATTER_FIELDS'
import { splitFrontmatter } from './splitFrontmatter'
import { stripFrontmatterKeys } from './stripFrontmatterKeys'

export const stripAnthropicOnlyFields = (skillMdContent: string): string => {
  const { frontmatter, body } = splitFrontmatter(skillMdContent)
  if (!frontmatter) return skillMdContent
  const stripped = stripFrontmatterKeys(
    frontmatter,
    ANTHROPIC_ONLY_FRONTMATTER_FIELDS,
  )
  return `---\n${stripped}\n---\n${body}`
}
