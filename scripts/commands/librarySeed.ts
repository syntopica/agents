import { promises as fs } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { listAuthoredBundles } from '../lib/library/cli/listAuthoredBundles'
import { listRulePaths } from '../lib/library/cli/listRulePaths'
import { listSkillBundles } from '../lib/library/cli/listSkillBundles'
import { readCurationManifest } from '../lib/library/cli/readCurationManifest'
import { readSkillLock } from '../lib/library/cli/readSkillLock'
import { resolveLibraryDir } from '../lib/library/cli/resolveLibraryDir'
import { formatSeedReport } from '../lib/library/formatters/formatSeedReport'
import { mergeSeedIntoManifest } from '../lib/library/mergeSeedIntoManifest'
import { seedManifestFromLock } from '../lib/library/seedManifestFromLock'
import { seedRuleEntries } from '../lib/library/seedRuleEntries'
import { flagValue } from '../lib/machine/cli/flagValue'

export const main = async () => {
  const asJson = process.argv.includes('--json')
  const dryRun = process.argv.includes('--dry-run')
  const flag = flagValue(process.argv, '--library')

  const libraryDir = resolveLibraryDir({
    ...(flag === undefined ? {} : { flag }),
    env: process.env,
    home: homedir(),
  })

  const lock = await readSkillLock(libraryDir)

  if (Object.keys(lock).length === 0) {
    console.error(`no .skill-lock.json under ${libraryDir}`)
    process.exitCode = 1
    return
  }

  const skills = seedManifestFromLock(
    lock,
    await listAuthoredBundles(libraryDir),
    await listSkillBundles(libraryDir),
  )

  const rulesRoot =
    flagValue(process.argv, '--rules') ?? join(process.cwd(), 'src/rules')
  const rules = seedRuleEntries(await listRulePaths(rulesRoot), 'rocket-agents')
  const seeded = { ...skills, entries: { ...skills.entries, ...rules } }
  const current = await readCurationManifest(libraryDir)
  const merged = current.ok
    ? mergeSeedIntoManifest(current.manifest, seeded)
    : { manifest: seeded, added: Object.keys(seeded.entries) }

  if (!dryRun) {
    await fs.writeFile(
      join(libraryDir, 'curation.json'),
      `${JSON.stringify(merged.manifest, null, 2)}\n`,
    )
  }

  console.log(formatSeedReport(merged.manifest, asJson))
  console.log(`entries added by this seed: ${String(merged.added.length)}`)
}
