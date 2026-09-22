import { promises as fs } from 'node:fs'
import { join } from 'node:path'

export const readSkillDescription = async (skillDir: string) => {
  let contents: string

  try {
    contents = await fs.readFile(join(skillDir, 'SKILL.md'), 'utf8')
  } catch {
    return undefined
  }

  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(contents)?.[1]

  if (frontmatter === undefined) {
    return undefined
  }

  const description = /^description:\s*(.+(?:\n\s+.+)*)/m.exec(frontmatter)?.[1]

  return description?.replaceAll(/\s+/g, ' ').trim()
}
