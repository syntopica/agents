import { homedir } from 'node:os'
import { join } from 'node:path'
import { applySessionArchive } from '../lib/codex-state/applySessionArchive'
import { planSessionArchive } from '../lib/codex-state/planSessionArchive'
import { flagValue } from '../lib/machine/cli/flagValue'
import { createRunId } from '../lib/machine/runs/createRunId'

export const main = async () => {
  const home = homedir()
  const codexDir = join(home, '.codex')
  const retentionDays = Number(
    flagValue(process.argv, '--retention-days') ?? '90',
  )
  const plan = await planSessionArchive(join(codexDir, 'sessions'), {
    retentionDays,
    now: new Date(),
  })
  if (!process.argv.includes('--apply')) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          applied: false,
          retentionDays,
          sessions: plan.entries.length,
          bytes: plan.totalBytes,
          skippedMalformed: plan.skippedMalformed.length,
        },
        null,
        2,
      ),
    )
    return
  }

  const runId = createRunId(new Date(), Math.random)
  const result = await applySessionArchive(
    plan,
    join(codexDir, 'session-archive'),
    runId,
  )
  const ok = result.status === 'archived'
  console.log(
    JSON.stringify(
      {
        ok,
        applied: ok,
        status: result.status,
        sessions: result.entries.length,
        bytes: plan.totalBytes,
        runDir: result.runDir,
        reasons: result.reasons,
        ...(ok
          ? {
              restoreCommand: `pnpm run codex:restore -- --run "${result.runDir}" --apply`,
            }
          : {}),
      },
      null,
      2,
    ),
  )
  process.exitCode = ok ? 0 : 1
}
