import type { SplitFrontmatterResult } from '../types/SplitFrontmatterResult'

export const splitFrontmatter = (content: string): SplitFrontmatterResult => {
  if (!content.startsWith('---\n')) {
    return { frontmatter: '', body: content }
  }
  const end = content.indexOf('\n---', 4)
  if (end === -1) {
    return { frontmatter: '', body: content }
  }
  const frontmatter = content.slice(4, end)
  const body = content.slice(end + 4).replace(/^\n/, '')
  return { frontmatter, body }
}
