import { access, cp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { resolveSkillSourceLogicalName } from './resolveSkillSourceLogicalName'
import type { SkillSource } from './types/SkillSource'

export const importInstalledSkillSource = async (
  source: SkillSource,
  installedSkillsDir: string,
  libraryDir: string,
): Promise<void> => {
  for (const skill of source.skills) {
    const installedPath = join(installedSkillsDir, skill)
    const exists = await access(installedPath)
      .then(() => true)
      .catch(() => false)
    if (!exists)
      throw new Error(`${skill}: skillkit did not create ${installedPath}`)
    const destinationPath = join(
      libraryDir,
      'skills',
      resolveSkillSourceLogicalName(source, skill),
    )
    await rm(destinationPath, { recursive: true, force: true })
    await cp(installedPath, destinationPath, { recursive: true })
  }
}
