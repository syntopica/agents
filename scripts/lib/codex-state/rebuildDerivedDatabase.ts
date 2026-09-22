import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { appendQuarantineManifest } from './appendQuarantineManifest'
import { isCodexActive } from './isCodexActive'
import { listDatabaseFamily } from './listDatabaseFamily'
import { quarantineFile } from './quarantineFile'
import { runSqliteIntegrityCheck } from './runSqliteIntegrityCheck'
import type { CodexRepairOptions } from './types/CodexRepairOptions'
import type { QuarantineResult } from './types/QuarantineResult'
import { verifyCodexSnapshot } from './verifyCodexSnapshot'

export const rebuildDerivedDatabase = async (
  options: CodexRepairOptions,
): Promise<QuarantineResult> => {
  const activity = await isCodexActive(options.codexDir, options.processTable)
  if (activity.active)
    return { status: 'blocked', entries: [], reasons: activity.reasons }
  const databaseName = 'memories_1.sqlite'
  const integrity = await runSqliteIntegrityCheck(
    join(options.codexDir, databaseName),
  )
  if (integrity.status !== 'corrupt')
    return { status: 'not-corrupt', entries: [], reasons: [] }

  const verification = await verifyCodexSnapshot(options.snapshotDir)
  if (!verification.ok) {
    return {
      status: 'snapshot-invalid',
      entries: [],
      reasons: verification.errors,
    }
  }
  const manifest = JSON.parse(
    await readFile(join(options.snapshotDir, 'manifest.json'), 'utf8'),
  ) as { entries?: { relativePath?: string }[] }
  if (
    manifest.entries?.some(
      ({ relativePath }) => relativePath === databaseName,
    ) !== true
  ) {
    return {
      status: 'snapshot-invalid',
      entries: [],
      reasons: ['snapshot does not contain memories_1.sqlite'],
    }
  }

  const family = await listDatabaseFamily(join(options.codexDir, databaseName))
  const entries = []
  for (const sourcePath of family) {
    entries.push(
      await quarantineFile({
        sourcePath,
        codexDir: options.codexDir,
        snapshotDir: options.snapshotDir,
      }),
    )
  }
  await appendQuarantineManifest(options.snapshotDir, entries)
  return { status: 'quarantined', entries, reasons: [] }
}
