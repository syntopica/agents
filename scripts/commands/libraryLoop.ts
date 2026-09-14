import { promises as fs } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { readLoopConfig } from '../lib/library/cli/readLoopConfig'
import { resolveLearningDir } from '../lib/library/cli/resolveLearningDir'
import { runBinStage } from '../lib/library/cli/runBinStage'
import type { StageResult } from '../lib/library/cli/types/StageResult'
import { isLoopDue } from '../lib/library/learning/isLoopDue'
import { writeLoopReport } from '../lib/library/learning/writeLoopReport'
import { flagValue } from '../lib/machine/cli/flagValue'

export const main = async () => {
  const home = homedir()
  const dryRun = process.argv.includes('--dry-run')
  const learningFlag = flagValue(process.argv, '--learning')

  const learningDir = resolveLearningDir({
    ...(learningFlag === undefined ? {} : { flag: learningFlag }),
    env: process.env,
    home,
  })

  const reportsDir = join(learningDir, 'reports')
  const ifDue = flagValue(process.argv, '--if-due')

  if (ifDue !== undefined) {
    const intervalDays = Number(ifDue)

    if (!Number.isFinite(intervalDays) || intervalDays <= 0) {
      console.error(`--if-due expects a positive number of days, got: ${ifDue}`)
      process.exitCode = 1
      return
    }

    const reportNames = await fs.readdir(reportsDir).catch(() => [] as string[])

    if (!isLoopDue(reportNames, intervalDays, new Date())) {
      console.log(
        `skipped: a report younger than ${String(intervalDays)} day(s) exists in ${reportsDir}`,
      )
      return
    }
  }

  const config = await readLoopConfig(learningDir)
  const classifyCommand =
    flagValue(process.argv, '--classify-command') ??
    process.env['LIBRARY_CLASSIFY_COMMAND'] ??
    config.classifyCommand

  const bin = (script: string) => join(process.cwd(), 'scripts', 'bin', script)
  const passthrough = dryRun ? ['--dry-run'] : []
  const results: StageResult[] = []

  results.push(
    await runBinStage('Observe', bin('run-library-observe.ts'), passthrough),
  )
  results.push(
    await runBinStage(
      'Observe codex',
      bin('run-library-observe-codex.ts'),
      passthrough,
    ),
  )

  if (dryRun) {
    results.push({
      name: 'Classify',
      ok: true,
      output:
        'skipped: dry runs never spend model quota. Run without --dry-run to classify.',
    })
  } else if (classifyCommand === undefined) {
    results.push({
      name: 'Classify',
      ok: true,
      output:
        'skipped: no classifier configured. Set classifyCommand in ' +
        `${join(learningDir, 'loop-config.json')} or pass --classify-command.`,
    })
  } else {
    results.push(
      await runBinStage('Classify', bin('run-library-classify.ts'), [
        '--command',
        classifyCommand,
      ]),
    )
  }

  results.push(
    await runBinStage('Triggers', bin('run-library-triggers.ts'), passthrough),
  )
  results.push(
    await runBinStage(
      'Router audit',
      bin('run-library-router-audit.ts'),
      passthrough,
    ),
  )
  results.push(
    await runBinStage('Propose', bin('run-library-propose.ts'), [
      '--procedures',
      join(learningDir, 'procedures.json'),
    ]),
  )
  results.push(
    await runBinStage('Auto-park', bin('run-library-auto.ts'), passthrough),
  )
  results.push(
    await runBinStage('Descriptions', bin('run-library-describe.ts'), []),
  )

  const date = new Date().toISOString().slice(0, 10)
  const sections = results.map((result) => ({
    title: result.ok ? result.name : `${result.name} (FAILED)`,
    body: result.output.slice(0, 4000),
  }))

  const failed = results.filter((result) => !result.ok)

  if (dryRun) {
    console.log(
      sections
        .map((section) => `## ${section.title}\n${section.body}`)
        .join('\n\n'),
    )
  } else {
    const reportPath = await writeLoopReport(reportsDir, date, sections)
    console.log(`report: ${reportPath}`)
  }

  console.log(
    `stages: ${String(results.length)}, failed: ${String(failed.length)}`,
  )

  if (failed.length > 0) {
    process.exitCode = 1
  }
}
