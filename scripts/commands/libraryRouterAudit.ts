import { promises as fs } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { compareRouterExpectationCorpus } from '../lib/hooks/compareRouterExpectationCorpus'
import { loadRouterExpectations } from '../lib/hooks/loadRouterExpectations'
import { resolveLearningDir } from '../lib/library/cli/resolveLearningDir'
import { resolveLibraryDir } from '../lib/library/cli/resolveLibraryDir'
import { formatRouterOutcomeLine } from '../lib/library/formatters/formatRouterOutcomeLine'
import { isSkillTarget } from '../lib/library/isSkillTarget'
import { classifyRouterOutcome } from '../lib/library/learning/classifyRouterOutcome'
import { laneFromContext } from '../lib/library/learning/laneFromContext'
import { runRouterProbe } from '../lib/library/learning/runRouterProbe'
import type { RouterOutcome } from '../lib/library/learning/types/RouterOutcome'
import { validateRouterReachability } from '../lib/library/learning/validators/validateRouterReachability'
import { flagValue } from '../lib/machine/cli/flagValue'

export const main = async () => {
  const home = homedir()
  const asJson = process.argv.includes('--json')
  const learningFlag = flagValue(process.argv, '--learning')
  const libraryFlag = flagValue(process.argv, '--library')
  const target = flagValue(process.argv, '--target') ?? 'codex'

  if (!isSkillTarget(target)) {
    console.error(`unsupported skill target: ${target}`)
    process.exitCode = 1
    return
  }

  const libraryDir = resolveLibraryDir({
    ...(libraryFlag === undefined ? {} : { flag: libraryFlag }),
    env: process.env,
    home,
  })
  const reachabilityErrors = await validateRouterReachability(
    libraryDir,
    target,
  )
  if (reachabilityErrors.length > 0) {
    console.error(
      asJson
        ? JSON.stringify({ target, reachabilityErrors }, null, 2)
        : reachabilityErrors.join('\n'),
    )
    process.exitCode = 1
    return
  }

  const learningDir = resolveLearningDir({
    ...(learningFlag === undefined ? {} : { flag: learningFlag }),
    env: process.env,
    home,
  })

  const routerPath =
    flagValue(process.argv, '--router') ??
    join(process.cwd(), 'src/hooks/utils/route_prompt.py')
  const expectationsPath =
    flagValue(process.argv, '--expectations') ??
    join(process.cwd(), 'src/hooks/router-expectations.json')

  let phrases: Record<string, string[]>
  try {
    phrases = JSON.parse(
      await fs.readFile(join(learningDir, 'trigger-phrases.json'), 'utf8'),
    ) as Record<string, string[]>
  } catch {
    console.error(
      `no trigger-phrases.json under ${learningDir}; run library:triggers first`,
    )
    process.exitCode = 1
    return
  }
  const expectationManifest = await loadRouterExpectations(expectationsPath)
  // Trigger learning rewrites trigger-phrases.json on every loop run, so the
  // hand-maintained expectations manifest is expected to drift from it. Drift
  // is a review queue for the next manifest update, not an audit failure.
  const corpusDrift = compareRouterExpectationCorpus(
    phrases,
    expectationManifest.expectations,
  )

  const outcomes: RouterOutcome[] = []

  for (const expectation of expectationManifest.expectations) {
    const lane = laneFromContext(
      await runRouterProbe(routerPath, expectation.phrase),
    )
    const skill = expectation.sourceSkills.join(',')
    outcomes.push({
      skill,
      phrase: expectation.phrase,
      ...(lane === undefined ? {} : { lane }),
      ...(expectation.expectedLane === undefined
        ? { intentionalSilence: true as const }
        : { expectedLane: expectation.expectedLane }),
      verdict: classifyRouterOutcome(skill, lane, expectation),
    })
  }

  const counts = {
    correct: outcomes.filter((outcome) => outcome.verdict === 'correct-lane')
      .length,
    wrong: outcomes.filter((outcome) => outcome.verdict === 'wrong-lane')
      .length,
    silent: outcomes.filter((outcome) => outcome.verdict === 'no-lane').length,
  }

  if (!process.argv.includes('--dry-run')) {
    await fs.writeFile(
      join(learningDir, 'router-audit.json'),
      `${JSON.stringify({ counts, corpusDrift, outcomes }, null, 2)}\n`,
    )
  }

  console.log(
    asJson
      ? JSON.stringify({ counts, corpusDrift, outcomes }, null, 2)
      : [
          `phrases probed: ${String(outcomes.length)}`,
          `  fired the right lane: ${String(counts.correct)}`,
          `  fired a different lane: ${String(counts.wrong)}`,
          `  fired nothing: ${String(counts.silent)}`,
          `corpus drift vs learned phrases: ${String(corpusDrift.length)}`,
          ...corpusDrift.slice(0, 10).map((line) => `  ${line}`),
          '',
          ...outcomes
            .filter((outcome) => outcome.verdict !== 'correct-lane')
            .slice(0, 20)
            .map(formatRouterOutcomeLine),
        ].join('\n'),
  )
}
