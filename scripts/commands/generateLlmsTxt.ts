import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { LLMS_TXT } from '../constants/LLMS_TXT'
import { skillDirs } from '../constants/skillDirs'
import { skills } from '../constants/skills'
import { listEngineSkillNames } from '../lib/skills/loaders/listEngineSkillNames'
import { parseDescription } from '../lib/skills/parsers/parseDescription'
import { parseFrontmatter } from '../lib/skills/parsers/parseFrontmatter'
import { stripQuotes } from '../lib/skills/transformers/stripQuotes'
import { buildLlmsTxt } from './buildLlmsTxt'

export const main = async () => {
  const engineSkillNames = await listEngineSkillNames()
  if (skillDirs.length === 0) {
    console.error('No skill directories found under src/skills/')
    process.exit(1)
  }
  for (const skillPath of skillDirs) {
    const skillMd = join(skillPath, 'SKILL.md')
    const content = readFileSync(skillMd, 'utf-8')
    const fm = parseFrontmatter(content)
    if (!fm) continue

    const name = stripQuotes(fm.fields.get('name') ?? '')
    const description = parseDescription(fm.raw)
    if (!name || !description) continue
    if (!engineSkillNames.has(name)) continue

    skills.push({ name, description, skillPath })
  }

  skills.sort((a: { name: string }, b: { name: string }) =>
    a.name.localeCompare(b.name),
  )
  writeFileSync(LLMS_TXT, buildLlmsTxt(skills), 'utf-8')

  console.log(`Wrote ${LLMS_TXT} (${String(skills.length)} skills).`)
}
