import { promises as fs } from 'node:fs'
import path from 'node:path'

export const collectCodexSkillTrimFiles = async (
  directory: string,
): Promise<string[]> => {
  const files: string[] = []
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const child = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await collectCodexSkillTrimFiles(child)))
    } else if (entry.name === 'SKILL.md' && entry.isFile()) {
      files.push(child)
    }
  }
  return files
}
