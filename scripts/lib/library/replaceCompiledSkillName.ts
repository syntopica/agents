import { replaceFrontmatter } from '../skills/transformers/replaceFrontmatter'
import { splitFrontmatter } from '../skills/transformers/splitFrontmatter'

export const replaceCompiledSkillName = (
  contents: string,
  targetName: string,
): string => {
  const { frontmatter } = splitFrontmatter(contents)
  if (frontmatter === '') return contents
  const lines = frontmatter.split('\n')
  const index = lines.findIndex((line) => line.startsWith('name:'))
  if (index === -1) return contents
  lines[index] = `name: ${targetName}`
  return replaceFrontmatter(contents, lines.join('\n'))
}
