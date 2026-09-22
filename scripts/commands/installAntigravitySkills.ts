import { promises as fs } from 'node:fs'
import path from 'node:path'
import { SKILL_SOURCE_DIRS } from '../constants/SKILL_SOURCE_DIRS'
import { ANTIGRAVITY_SKILLS_DIR } from '../lib/link/constants/ANTIGRAVITY_SKILLS_DIR'
import { copySkillToTargetWithTransform } from '../lib/link/operations/copySkillToTargetWithTransform'
import { rewriteAntigravityRuleRefs } from '../lib/link/operations/rewriteAntigravityRuleRefs'
import { listSkillDirsAcross } from '../lib/skills/loaders/listSkillDirsAcross'

export const installAntigravitySkills = async (): Promise<void> => {
  await fs.mkdir(ANTIGRAVITY_SKILLS_DIR, { recursive: true })

  const skillSourceDirs = await listSkillDirsAcross(SKILL_SOURCE_DIRS)

  let installed = 0
  for (const sourceDir of skillSourceDirs) {
    const skillName = path.basename(sourceDir)
    const target = path.join(ANTIGRAVITY_SKILLS_DIR, skillName)
    await copySkillToTargetWithTransform({
      source: sourceDir,
      target,
      transformContent: rewriteAntigravityRuleRefs,
    })
    installed++
    console.log(`[antigravity] installed: ${skillName}`)
  }

  console.log(`\n[antigravity] Done. Installed ${String(installed)} skills.`)
}
