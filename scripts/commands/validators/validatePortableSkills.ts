import { existsSync } from 'node:fs'
import { DIST_SKILLS_PORTABLE_DIR } from '../../constants/DIST_SKILLS_PORTABLE_DIR'
import { listSkillDirs } from '../../lib/skills/loaders/listSkillDirs'
import { runValidate } from '../../runners/runValidate'
import { detectValidator } from '../../validators/detectValidator'

export const validatePortableSkills = async (): Promise<boolean> => {
  if (!existsSync(DIST_SKILLS_PORTABLE_DIR)) {
    console.warn(
      '[validate] dist/skills-portable not found; run `pnpm run build` first. Skipping external validation.',
    )
    return true
  }

  const dirs = await listSkillDirs(DIST_SKILLS_PORTABLE_DIR)
  if (dirs.length === 0) {
    console.warn(
      '[validate] dist/skills-portable has no skills. Skipping external validation.',
    )
    return true
  }

  const method = detectValidator(String(dirs[0]))
  if (!method) {
    console.warn(
      '[validate] agentskills validator not found; run `pnpm run validate:install`. Skipping external validation.',
    )
    return true
  }

  let ok = true
  for (const dir of dirs) {
    const result = runValidate(dir, method)
    if (!result.ok) {
      ok = false
      console.error(`[validate] ${dir}\n${result.stderr}`)
    }
  }

  if (ok)
    console.log(
      `[validate] agentskills OK (${String(dirs.length)} skills, method: ${method})`,
    )
  return ok
}
