import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { skillDirs } from '../constants/skillDirs'
import { violations } from '../constants/violations'
import { parseFrontmatter } from '../lib/skills/parsers/parseFrontmatter'

export const main = () => {
  if (skillDirs.length === 0) {
    console.error('No source skills found under src/skills')
    process.exit(1)
  }
  for (const skillPath of skillDirs) {
    const skillMdPath = join(skillPath, 'SKILL.md')
    const content = readFileSync(skillMdPath, 'utf8')
    const fm = parseFrontmatter(content)
    if (!fm) {
      violations.push(`${skillMdPath}: missing frontmatter`)
      continue
    }

    const keys = Array.from(fm.fields.keys())
    const unexpected = keys.filter(
      (key: string) => key !== 'name' && key !== 'description',
    )
    if (unexpected.length > 0) {
      violations.push(
        `${skillMdPath}: unexpected frontmatter fields (${unexpected.join(', ')})`,
      )
    }
  }
  if (violations.length > 0) {
    console.error('Skill frontmatter contract violations detected:')
    for (const violation of violations) {
      console.error(`- ${violation}`)
    }
    process.exit(1)
  }

  console.log(`Frontmatter contract OK (${String(skillDirs.length)} skills).`)
}
