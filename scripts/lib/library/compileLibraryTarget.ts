import { access, rm } from 'node:fs/promises'
import { compileLibrarySkill } from './compileLibrarySkill'
import { deduplicatePlannedLinks } from './deduplicatePlannedLinks'
import { expandPlannedLink } from './expandPlannedLink'
import { planLinks } from './planLinks'
import type { CompiledLibraryTarget } from './types/CompiledLibraryTarget'
import type { SkillTarget } from './types/SkillTarget'

export const compileLibraryTarget = async (
  skillsRoot: string,
  outputRoot: string,
  target: SkillTarget,
  entryKeys: string[],
): Promise<CompiledLibraryTarget> => {
  const planned = planLinks(skillsRoot, entryKeys)
  const expanded = deduplicatePlannedLinks(
    (await Promise.all(planned.map(expandPlannedLink))).flat(),
  )
  const compiled: CompiledLibraryTarget['compiled'] = []
  const missing: string[] = []
  await rm(outputRoot, { recursive: true, force: true })
  for (const link of expanded) {
    const exists = await access(link.target)
      .then(() => true)
      .catch(() => false)
    if (!exists) {
      missing.push(`${link.entryKey} has no directory at ${link.target}`)
      continue
    }
    compiled.push(
      await compileLibrarySkill({
        logicalName: link.logicalName,
        sourcePath: link.target,
        outputRoot,
        target,
      }),
    )
  }
  return { compiled, missing }
}
