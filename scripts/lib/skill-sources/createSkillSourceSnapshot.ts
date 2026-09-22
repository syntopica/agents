import { access, cp, mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { resolveSkillSourceLogicalName } from './resolveSkillSourceLogicalName'
import type { SkillSourceManifest } from './types/SkillSourceManifest'
import type { SkillSourceSnapshot } from './types/SkillSourceSnapshot'

export const createSkillSourceSnapshot = async (
  libraryDir: string,
  manifest: SkillSourceManifest,
  runId: string,
): Promise<SkillSourceSnapshot> => {
  const snapshotDir = join(libraryDir, 'backups', 'skill-sources', runId)
  await mkdir(join(snapshotDir, 'skills'), { recursive: true, mode: 0o700 })

  const lockPath = join(libraryDir, '.skill-lock.json')
  const lockExists = await access(lockPath)
    .then(() => true)
    .catch(() => false)
  if (lockExists) await cp(lockPath, join(snapshotDir, '.skill-lock.json'))

  const entries: { skill: string; logicalName: string; existed: boolean }[] = []
  for (const source of manifest.sources) {
    for (const skill of source.skills) {
      const logicalName = resolveSkillSourceLogicalName(source, skill)
      const sourcePath = join(libraryDir, 'skills', logicalName)
      const existed = await access(sourcePath)
        .then(() => true)
        .catch(() => false)
      if (existed)
        await cp(sourcePath, join(snapshotDir, 'skills', logicalName), {
          recursive: true,
        })
      entries.push({ skill, logicalName, existed })
    }
  }

  const manifestPath = join(snapshotDir, 'manifest.json')
  await writeFile(
    manifestPath,
    `${JSON.stringify({ version: 1, lockExisted: lockExists, entries }, null, 2)}\n`,
    { mode: 0o600 },
  )
  return { snapshotDir, manifestPath }
}
