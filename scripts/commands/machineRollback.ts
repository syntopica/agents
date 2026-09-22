import { homedir } from 'node:os'
import { join } from 'node:path'
import { flagValue } from '../lib/machine/cli/flagValue'
import { resolveRunsDir } from '../lib/machine/cli/resolveRunsDir'
import { formatRunReport } from '../lib/machine/report/formatters/formatRunReport'
import { listRuns } from '../lib/machine/runs/listRuns'
import { restoreSnapshot } from '../lib/machine/runs/restoreSnapshot'
import type { RunReport } from '../lib/machine/types/RunReport'

export const main = async () => {
  const home = homedir()
  const asJson = process.argv.includes('--json')
  const runsDir = resolveRunsDir(home)
  const runs = await listRuns(runsDir)

  const requested = flagValue(process.argv, '--to') ?? runs.at(-1)?.runId

  if (!requested) {
    const report: RunReport = {
      runId: 'rollback',
      profile: 'full',
      domains: [
        {
          domain: 'machine',
          status: 'failed',
          changes: 0,
          messages: ['no runs to roll back'],
        },
      ],
      ok: false,
    }
    console.log(formatRunReport(report, asJson))
    process.exitCode = 1
    return
  }

  const restored = await restoreSnapshot({ runDir: join(runsDir, requested) })

  const report: RunReport = {
    runId: requested,
    profile: 'full',
    domains: [
      {
        domain: 'machine',
        status: 'changed',
        changes: restored.length,
        messages: restored.map((path) => `restored ${path}`),
      },
    ],
    ok: true,
  }

  console.log(formatRunReport(report, asJson))
}
