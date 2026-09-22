import { promises as fs } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { applyTransition } from '../lib/library/applyTransition'
import { buildSkillKeyIndex } from '../lib/library/buildSkillKeyIndex'
import { listSkillPaths } from '../lib/library/cli/listSkillPaths'
import { readCurationManifest } from '../lib/library/cli/readCurationManifest'
import { resolveLibraryDir } from '../lib/library/cli/resolveLibraryDir'
import { writeCurationManifest } from '../lib/library/cli/writeCurationManifest'
import { readInvocationCounts } from '../lib/library/learning/readInvocationCounts'
import { remapInvocations } from '../lib/library/learning/remapInvocations'
import { selectIdleEntries } from '../lib/library/selectors/selectIdleEntries'
import type { CurationManifest } from '../lib/library/types/CurationManifest'
import { flagValue } from '../lib/machine/cli/flagValue'

export const main = async () => {
  const home = homedir()
  const dryRun = process.argv.includes('--dry-run')
  const target = flagValue(process.argv, '--target') ?? 'claude'
  const today =
    flagValue(process.argv, '--date') ?? new Date().toISOString().slice(0, 10)
  const libraryFlag = flagValue(process.argv, '--library')

  const libraryDir = resolveLibraryDir({
    ...(libraryFlag === undefined ? {} : { flag: libraryFlag }),
    env: process.env,
    home,
  })

  const parsed = await readCurationManifest(libraryDir)

  if (!parsed.ok) {
    console.error(parsed.errors.join('\n'))
    process.exitCode = 1
    return
  }

  const keyIndex = buildSkillKeyIndex(
    Object.keys(parsed.manifest.entries),
    await listSkillPaths(libraryDir),
  )
  const counts = remapInvocations(
    await readInvocationCounts(
      join(libraryDir, 'learning', 'invocations.json'),
    ),
    keyIndex,
  )

  const idle = selectIdleEntries({
    manifest: parsed.manifest,
    invocations: counts,
    target,
    authoredSource: 'rocket-agents',
    today,
    idleDays: Number(flagValue(process.argv, '--idle-days') ?? '30'),
  })
  const applied: string[] = []
  const refused: string[] = []
  let manifest: CurationManifest = parsed.manifest

  for (const name of idle) {
    const result = applyTransition(
      manifest,
      name,
      'parked',
      {
        reason: `no invocation measured while adopted, parked automatically on ${today}`,
      },
      today,
    )

    if (result.ok) {
      manifest = result.manifest
      applied.push(name)
    } else {
      refused.push(`${name}: ${result.error}`)
    }
  }

  if (!dryRun && applied.length > 0) {
    await writeCurationManifest(libraryDir, manifest)
    await fs.mkdir(join(libraryDir, 'learning'), { recursive: true })
    const logLines = applied.map((name) => `${today} parked ${name}`)
    await fs.appendFile(
      join(libraryDir, 'learning', 'auto-actions.log'),
      `${logLines.join('\n')}\n`,
    )
  }

  const verb = dryRun ? 'would park' : 'parked'

  console.log(
    [
      `${verb}: ${String(applied.length)}`,
      ...applied.map((name) => `  - ${name}`),
      ...refused.map((line) => `  ! ${line}`),
    ].join('\n'),
  )
}
