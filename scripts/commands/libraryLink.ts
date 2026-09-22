import { homedir } from 'node:os'
import { join } from 'node:path'
import { readCurationManifest } from '../lib/library/cli/readCurationManifest'
import { resolveLibraryDir } from '../lib/library/cli/resolveLibraryDir'
import { compileLibraryTarget } from '../lib/library/compileLibraryTarget'
import { deduplicatePlannedLinks } from '../lib/library/deduplicatePlannedLinks'
import { expandPlannedLink } from '../lib/library/expandPlannedLink'
import { findLinkCollisions } from '../lib/library/findLinkCollisions'
import { formatLinkReport } from '../lib/library/formatters/formatLinkReport'
import { installPlannedLinks } from '../lib/library/installPlannedLinks'
import { isSkillTarget } from '../lib/library/isSkillTarget'
import { linkStrategyForTarget } from '../lib/library/linkStrategyForTarget'
import { planLinks } from '../lib/library/planLinks'
import { resolveLinkDir } from '../lib/library/resolveLinkDir'
import { selectFannedOutSkills } from '../lib/library/selectors/selectFannedOutSkills'
import type { PlannedLink } from '../lib/library/types/PlannedLink'
import { validateCompiledLibrary } from '../lib/library/validators/validateCompiledLibrary'
import { flagValue } from '../lib/machine/cli/flagValue'

export const main = async () => {
  const home = homedir()
  const asJson = process.argv.includes('--json')
  const dryRun = process.argv.includes('--dry-run')
  const target = flagValue(process.argv, '--target') ?? 'claude'
  const flag = flagValue(process.argv, '--library')

  const libraryDir = resolveLibraryDir({
    ...(flag === undefined ? {} : { flag }),
    env: process.env,
    home,
  })

  if (!isSkillTarget(target)) {
    console.error(`unsupported skill target: ${target}`)
    process.exitCode = 1
    return
  }

  const parsed = await readCurationManifest(libraryDir)

  if (!parsed.ok) {
    console.error(parsed.errors.join('\n'))
    process.exitCode = 1
    return
  }

  const skillsRoot = join(libraryDir, 'skills')
  const entryKeys = selectFannedOutSkills(parsed.manifest, target)
  const missing: string[] = []
  let links: PlannedLink[]
  if (target === 'claude') {
    const planned = planLinks(skillsRoot, entryKeys)
    links = deduplicatePlannedLinks(
      (await Promise.all(planned.map(expandPlannedLink))).flat(),
    )
  } else {
    const result = await compileLibraryTarget(
      skillsRoot,
      join(libraryDir, 'compiled', target, 'skills'),
      target,
      entryKeys,
    )
    const errors = await validateCompiledLibrary(result.compiled, target)
    if (errors.length > 0) {
      console.error(errors.join('\n'))
      process.exitCode = 1
      return
    }
    links = result.compiled.map(({ logicalName, targetName, outputPath }) => ({
      name: targetName,
      target: outputPath,
      entryKey: logicalName,
      logicalName,
    }))
    missing.push(...result.missing)
  }
  const collisions = findLinkCollisions(links)

  if (collisions.length > 0) {
    console.error(collisions.join('\n'))
    process.exitCode = 1
    return
  }

  const linkDir = resolveLinkDir({
    into: flagValue(process.argv, '--into'),
    target,
    home,
  })

  if (linkDir === undefined) {
    console.error(
      `--into is required for target ${target}; only claude has a default destination`,
    )
    process.exitCode = 1
    return
  }
  const installed = await installPlannedLinks({
    links,
    linkDir,
    dryRun,
    strategy: linkStrategyForTarget(target),
  })
  const allMissing = [...missing, ...installed.missing]

  console.log(
    formatLinkReport(
      {
        target,
        planned: links.length + missing.length,
        linked: installed.created.length,
        created: installed.created,
        missing: allMissing,
        foreign: installed.foreign,
      },
      asJson,
    ),
  )
}
