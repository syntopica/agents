import { FRONTMATTER_RE } from '../constants/FRONTMATTER_RE'

export const replaceFrontmatter = (
  content: string,
  nextFrontmatter: string,
) => {
  const match = FRONTMATTER_RE.exec(content)
  if (!match) {
    return `---\n${nextFrontmatter}\n---\n\n${content.trimStart()}`
  }

  return content.replace(FRONTMATTER_RE, `---\n${nextFrontmatter}\n---`)
}
