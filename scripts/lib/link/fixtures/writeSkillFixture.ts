import { promises as fs } from 'node:fs'
import path from 'node:path'

export const writeSkillFixture = async (root: string, name: string) => {
  await fs.mkdir(path.join(root, name), { recursive: true })
  await fs.writeFile(path.join(root, name, 'SKILL.md'), `# ${name}\n`)
}
