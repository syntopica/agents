import { promises as fs } from 'node:fs'
import path from 'node:path'
import { copyDirRecursive } from '../../../operations/copyDirRecursive'
import { listSkillDirs } from '../loaders/listSkillDirs'
import { stripAnthropicOnlyFields } from '../transformers/stripAnthropicOnlyFields'

export const emitPortableSkillsFromDist = async ({
  distSkillsDir,
  distSkillsPortableDir,
}: {
  distSkillsDir: string
  distSkillsPortableDir: string
}): Promise<number> => {
  await fs.rm(distSkillsPortableDir, { recursive: true, force: true })
  await fs.mkdir(distSkillsPortableDir, { recursive: true })

  const skillDirs = await listSkillDirs(distSkillsDir)

  for (const sourceDir of skillDirs) {
    const relative = path.relative(distSkillsDir, sourceDir)
    const targetDir = path.join(distSkillsPortableDir, relative)
    await copyDirRecursive(sourceDir, targetDir)

    const skillMdPath = path.join(targetDir, 'SKILL.md')
    const original = await fs.readFile(skillMdPath, 'utf8')
    const stripped = stripAnthropicOnlyFields(original)
    if (stripped !== original) {
      await fs.writeFile(skillMdPath, stripped, 'utf8')
    }
  }

  return skillDirs.length
}
