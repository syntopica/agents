import { promises as fs } from 'node:fs'
import path from 'node:path'
import { copyDirRecursive } from '../../../operations/copyDirRecursive'
import { listSkillDirs } from '../../skills/loaders/listSkillDirs'

export const copyFlatSkillsIntoPluginRoot = async ({
  distSkillsDir,
  pluginSkillsDir,
}: {
  distSkillsDir: string
  pluginSkillsDir: string
}): Promise<string[]> => {
  await fs.rm(pluginSkillsDir, { recursive: true, force: true })
  await fs.mkdir(pluginSkillsDir, { recursive: true })

  const skillDirs = await listSkillDirs(distSkillsDir)
  const copied: string[] = []

  for (const sourceDir of skillDirs) {
    const flatName = path.basename(sourceDir)
    const targetDir = path.join(pluginSkillsDir, flatName)
    await copyDirRecursive(sourceDir, targetDir)
    copied.push(flatName)
  }

  return copied.sort((a, b) => a.localeCompare(b))
}
