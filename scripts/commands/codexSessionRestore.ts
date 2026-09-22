import { homedir } from 'node:os'
import { isAbsolute, join } from 'node:path'
import { pathExists } from '../lib/codex-state/pathExists'
import { restoreQuarantine } from '../lib/codex-state/restoreQuarantine'
import { restoreSessionArchive } from '../lib/codex-state/restoreSessionArchive'
import { flagValue } from '../lib/machine/cli/flagValue'

export const main = async () => {
  const home = homedir()
  const codexDir = join(home, '.codex')
  const requestedRun = flagValue(process.argv, '--run')
  if (requestedRun === undefined) {
    console.log(
      JSON.stringify({ ok: false, error: '--run is required' }, null, 2),
    )
    process.exitCode = 2
    return
  }
  const runDir = isAbsolute(requestedRun)
    ? requestedRun
    : join(codexDir, 'session-archive', requestedRun)
  const dryRun = !process.argv.includes('--apply')
  const isQuarantine = await pathExists(
    join(runDir, 'quarantine-manifest.json'),
  )
  const result = isQuarantine
    ? await restoreQuarantine({ snapshotDir: runDir, codexDir, dryRun })
    : await restoreSessionArchive({
        runDir,
        sessionsDir: join(codexDir, 'sessions'),
        dryRun,
      })
  const ok = result.status === 'planned' || result.status === 'restored'
  console.log(
    JSON.stringify(
      {
        ok,
        applied: !dryRun && result.status === 'restored',
        status: result.status,
        files: result.entries.length,
        reasons: result.reasons,
        runDir,
      },
      null,
      2,
    ),
  )
  process.exitCode = ok ? 0 : 1
}
