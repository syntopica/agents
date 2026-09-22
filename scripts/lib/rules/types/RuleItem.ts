import type { RuleFrontmatter } from './RuleFrontmatter'

export interface RuleItem {
  rel: string
  content?: string
  frontmatter?: RuleFrontmatter
  [key: string]: unknown
}
