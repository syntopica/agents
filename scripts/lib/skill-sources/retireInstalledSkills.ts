import { access, cp, mkdir, rm } from 'node:fs/promises'
import { join } from 'node:path'

// skillkit skips a skill that already exists unless --force, and --force also
// overrides a failed security scan, so the installed copy is moved into the
// run's backup instead: the install is fresh and the scan still gates it.
export const retireInstalledSkills = async (
  skills: readonly string[],
  installedSkillsDir: string,
  backupDir: string,
): Promise<void> => {
  for (const skill of skills) {
    const installedPath = join(installedSkillsDir, skill)
    const exists = await access(installedPath)
      .then(() => true)
      .catch(() => false)
    if (!exists) continue
    await mkdir(backupDir, { recursive: true, mode: 0o700 })
    await cp(installedPath, join(backupDir, skill), {
      recursive: true,
      verbatimSymlinks: true,
    })
    await rm(installedPath, { recursive: true, force: true })
  }
}
