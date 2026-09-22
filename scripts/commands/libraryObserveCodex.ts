import { promises as fs } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { resolveLibraryDir } from '../lib/library/cli/resolveLibraryDir'
import { listCodexRollouts } from '../lib/library/learning/listCodexRollouts'
import { looksLikeListingArtifact } from '../lib/library/learning/looksLikeListingArtifact'
import { readCodexSkillReadsFromFile } from '../lib/library/learning/readCodexSkillReadsFromFile'
import { flagValue } from '../lib/machine/cli/flagValue'
import { flagValues } from '../lib/machine/cli/flagValues'

export const main = async () => {
  const home = homedir()
  const asJson = process.argv.includes('--json')
  const libraryFlag = flagValue(process.argv, '--library')

  const libraryDir = resolveLibraryDir({
    ...(libraryFlag === undefined ? {} : { flag: libraryFlag }),
    env: process.env,
    home,
  })

  const sessionRoots = flagValues(process.argv, '--sessions')
  const roots =
    sessionRoots.length === 0
      ? [join(home, '.codex', 'sessions')]
      : sessionRoots
  const files = [
    ...new Set(
      (await Promise.all(roots.map((root) => listCodexRollouts(root)))).flat(),
    ),
  ]
  const counts: Record<string, number> = {}

  for (const file of files) {
    for (const [skill, count] of Object.entries(
      await readCodexSkillReadsFromFile(file),
    )) {
      counts[skill] = (counts[skill] ?? 0) + count
    }
  }

  const distinct = Object.keys(counts).length
  const artifact = looksLikeListingArtifact(counts)

  if (artifact) {
    console.error(
      'these counts are catalogue listings, not reads: too many skills share the same total.\n' +
        'Codex-side usage stays unmeasured rather than being reported as if it were real.',
    )
    process.exitCode = 1
    return
  }

  if (!process.argv.includes('--dry-run')) {
    await fs.mkdir(join(libraryDir, 'learning'), { recursive: true })
    await fs.writeFile(
      join(libraryDir, 'learning', 'codex-reads.json'),
      `${JSON.stringify(counts, null, 2)}\n`,
    )
  }

  const ranked = Object.entries(counts).toSorted(
    (left, right) => right[1] - left[1],
  )

  console.log(
    asJson
      ? JSON.stringify({ rollouts: files.length, distinct, counts }, null, 2)
      : [
          `rollouts scanned: ${String(files.length)}`,
          `skills read at least once: ${String(distinct)}`,
          ...ranked
            .slice(0, 15)
            .map(
              ([skill, count]) => `  ${String(count).padStart(4)}  ${skill}`,
            ),
        ].join('\n'),
  )
}
