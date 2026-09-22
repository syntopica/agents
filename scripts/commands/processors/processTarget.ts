import path from 'node:path'
import { CANONICAL_SKILLS_DIR } from '../../lib/link/constants/CANONICAL_SKILLS_DIR'
import { CANONICAL_SKILLS_PORTABLE_DIR } from '../../lib/link/constants/CANONICAL_SKILLS_PORTABLE_DIR'
import type { IdeRegistryEntry } from '../../lib/link/types/IdeRegistryEntry'
import { applyCapabilityLinks } from '../../lib/machine/domains/capabilities/applyCapabilityLinks'
import type { CapabilityTarget } from '../../lib/machine/domains/capabilities/types/CapabilityTarget'

export const processTarget = async (
  target: IdeRegistryEntry,
  skillNames: string[],
): Promise<boolean> => {
  const detectPaths =
    target.detectPaths ?? (target.rootDir ? [target.rootDir] : [])
  const flatten = target.flattenSkills ?? false
  const bundle = target.skillsBundle ?? 'portable'
  const sourceDir =
    bundle === 'claude' ? CANONICAL_SKILLS_DIR : CANONICAL_SKILLS_PORTABLE_DIR
  const usesCanonicalDirectory =
    target.skillsDir === undefined || target.linkStrategy === undefined
  let links: CapabilityTarget['links']
  let cleanup: NonNullable<CapabilityTarget['cleanup']>
  if (target.skillsDir === undefined || target.linkStrategy === undefined) {
    links = [
      {
        source: CANONICAL_SKILLS_DIR,
        target: CANONICAL_SKILLS_DIR,
        method: 'native' as const,
      },
    ]
    cleanup = []
  } else {
    const skillsDir = target.skillsDir
    const strategy = target.linkStrategy
    links = skillNames.map((skillName) => ({
      source: path.join(sourceDir, skillName),
      target: path.join(
        skillsDir,
        flatten ? path.basename(skillName) : skillName,
      ),
      method: strategy,
    }))
    cleanup = ['busirocket-', 'react-doctor'].map((prefix) => ({
      dir: skillsDir,
      prefix,
    }))
  }
  const result = await applyCapabilityLinks({
    id: target.id,
    capability: 'skills',
    support: 'supported',
    detectPaths,
    cleanup,
    links,
  })

  if (result.status === 'unavailable') {
    console.log(`- ${target.id}: skipped (target root not detected)`)
    return false
  }
  if (usesCanonicalDirectory) {
    console.log(
      `- ${target.id}: skipped (reads skills from the canonical directory)`,
    )
    return false
  }

  const strategy = target.linkStrategy ?? 'symlink'
  const changed = strategy === 'copy' ? result.copied : result.linked
  let verb = 'unchanged'
  if (changed > 0) verb = strategy === 'copy' ? 'copied' : 'linked'
  console.log(
    `+ ${target.id}: ${String(skillNames.length)} skills (${bundle}) distributed via ${strategy} (${verb})`,
  )

  return true
}
