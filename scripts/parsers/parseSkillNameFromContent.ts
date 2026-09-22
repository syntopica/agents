import { parseDescription } from '../lib/skills/parsers/parseDescription'
import { parseFrontmatter } from '../lib/skills/parsers/parseFrontmatter'
import { stripQuotes } from '../lib/skills/transformers/stripQuotes'

export const parseSkillNameFromContent = (
  content: string,
  filePath: string,
) => {
  const frontmatter = parseFrontmatter(content)
  if (!frontmatter) {
    throw new Error(`Missing frontmatter in ${filePath}`)
  }

  const rawName = frontmatter.fields.get('name')
  const name = stripQuotes(rawName ?? '')
  if (!name) {
    throw new Error(`Missing frontmatter 'name' in ${filePath}`)
  }

  const description = parseDescription(frontmatter.raw)
  if (!description) {
    throw new Error(`Missing frontmatter 'description' in ${filePath}`)
  }

  return name
}
