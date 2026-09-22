import { homedir } from 'node:os'
import { join } from 'node:path'
import { createCodexSnapshot } from '../lib/codex-state/createCodexSnapshot'
import { inspectCodexState } from '../lib/codex-state/inspectCodexState'
import { isCodexActive } from '../lib/codex-state/isCodexActive'
import { quarantineMalformedSessions } from '../lib/codex-state/quarantineMalformedSessions'
import { readCodexLoginStatus } from '../lib/codex-state/readCodexLoginStatus'
import { rebuildDerivedDatabase } from '../lib/codex-state/rebuildDerivedDatabase'
import { createRunId } from '../lib/machine/runs/createRunId'

export const main = async () => {
  const home = homedir()
  const codexDir = join(home, '.codex')
  const report = await inspectCodexState(codexDir)
  const corruptDerived = report.databases.some(
    ({ path, status }) =>
      path.endsWith('memories_1.sqlite') && status === 'corrupt',
  )
  const plan = {
    corruptDerivedDatabase: corruptDerived,
    malformedSessions: report.malformedSessions.length,
    loginMethod: await readCodexLoginStatus(),
  }
  if (!process.argv.includes('--apply')) {
    console.log(JSON.stringify({ ok: true, applied: false, plan }, null, 2))
    return
  }

  const activity = await isCodexActive(codexDir)
  if (activity.active) {
    console.log(
      JSON.stringify(
        { ok: false, applied: false, blocked: activity.reasons, plan },
        null,
        2,
      ),
    )
    process.exitCode = 1
    return
  }
  const runId = createRunId(new Date(), Math.random)
  const snapshot = await createCodexSnapshot({
    codexDir,
    backupsDir: join(codexDir, 'backups', 'state-recovery'),
    runId,
    databaseNames: corruptDerived ? ['memories_1.sqlite'] : [],
  })
  const database = await rebuildDerivedDatabase({
    codexDir,
    snapshotDir: snapshot.snapshotDir,
  })
  const sessions = await quarantineMalformedSessions({
    codexDir,
    snapshotDir: snapshot.snapshotDir,
    findings: report.malformedSessions,
  })
  const restoreCommand = `pnpm run codex:restore -- --run "${snapshot.snapshotDir}" --apply`
  const ok =
    (database.status === 'quarantined' || database.status === 'not-corrupt') &&
    sessions.status === 'quarantined'
  console.log(
    JSON.stringify(
      {
        ok,
        applied: true,
        snapshotDir: snapshot.snapshotDir,
        database: { status: database.status, files: database.entries.length },
        sessions: { status: sessions.status, files: sessions.entries.length },
        restoreCommand,
      },
      null,
      2,
    ),
  )
  process.exitCode = ok ? 0 : 1
}
