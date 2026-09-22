import { promises as fs } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { resolveLearningDir } from '../lib/library/cli/resolveLearningDir'
import { resolveLibraryDir } from '../lib/library/cli/resolveLibraryDir'
import { observeTranscripts } from '../lib/library/learning/observeTranscripts'
import { readTranscriptIndex } from '../lib/library/learning/readTranscriptIndex'
import { flagValue } from '../lib/machine/cli/flagValue'

export const main = async () => {
  const asJson = process.argv.includes('--json')
  const flag = flagValue(process.argv, '--library')
  const home = homedir()

  const libraryDir = resolveLibraryDir({
    ...(flag === undefined ? {} : { flag }),
    env: process.env,
    home,
  })

  const learningFlag = flagValue(process.argv, '--learning')
  const learningDir = resolveLearningDir({
    ...(learningFlag === undefined ? {} : { flag: learningFlag }),
    env: process.env,
    home,
  })
  const indexPath = join(learningDir, 'transcript-index.json')

  const seen = await readTranscriptIndex(indexPath)

  const root =
    flagValue(process.argv, '--transcripts') ??
    join(home, '.claude', 'projects')
  const { summary, turns, index } = await observeTranscripts(root, seen)

  if (!process.argv.includes('--dry-run')) {
    await fs.mkdir(learningDir, { recursive: true })
    await fs.writeFile(indexPath, `${JSON.stringify(index, null, 2)}\n`)
    await fs.writeFile(
      join(learningDir, 'requests.jsonl'),
      `${turns.map((turn) => JSON.stringify(turn)).join('\n')}\n`,
    )
    await fs.mkdir(join(libraryDir, 'learning'), { recursive: true })
    await fs.writeFile(
      join(libraryDir, 'learning', 'invocations.json'),
      `${JSON.stringify(summary.invocations, null, 2)}\n`,
    )
  }

  console.log(
    asJson
      ? JSON.stringify(summary, null, 2)
      : [
          `transcripts seen: ${String(summary.transcripts)}`,
          `skipped as unchanged: ${String(summary.skipped)}`,
          `human requests observed: ${String(summary.requests)}`,
          `distinct skills invoked: ${String(Object.keys(summary.invocations).length)}`,
        ].join('\n'),
  )
}
