import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { classifySkillPortability } from './classifySkillPortability'
import { listSkillDirs } from './loaders/listSkillDirs'
import type { SkillPortabilityFinding } from './types/SkillPortabilityFinding'

export const inspectSkillLibrary = async (
  root: string,
): Promise<SkillPortabilityFinding[]> => {
  const directories = await listSkillDirs(root)
  return Promise.all(
    directories.map(async (directory) => {
      const path = join(directory, 'SKILL.md')
      return classifySkillPortability(path, await readFile(path, 'utf8'))
    }),
  )
}
