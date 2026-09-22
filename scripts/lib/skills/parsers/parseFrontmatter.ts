import { FRONTMATTER_RE } from '../constants/FRONTMATTER_RE'
import type { Frontmatter } from '../types/Frontmatter'

export const parseFrontmatter = (content: string): Frontmatter | null => {
  const match = FRONTMATTER_RE.exec(content)
  if (!match) return null

  const raw = match[1]
  if (!raw) return null
  const lines = raw.split(/\r?\n/)
  const fields = new Map<string, string>()

  for (const line of lines) {
    const colonIndex = line.indexOf(':')
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim()
      const value = line.slice(colonIndex + 1).trim()
      if (/^[A-Za-z0-9_-]+$/.test(key)) {
        fields.set(key, value)
      }
    }
  }

  return { raw, lines, fields }
}
