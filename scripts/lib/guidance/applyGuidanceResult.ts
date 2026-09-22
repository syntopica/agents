import { chmod, mkdir, open, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createGuidanceSnapshot } from './createGuidanceSnapshot'
import { guidanceTargets } from './guidanceTargets'
import { restoreGuidanceSnapshot } from './restoreGuidanceSnapshot'
import { sha256Text } from './sha256Text'
import type { ReconciliationResult } from './types/ReconciliationResult'
import { writeGuidanceAtomically } from './writeGuidanceAtomically'

export const applyGuidanceResult = async (options: {
  home: string
  canonicalDir: string
  stateDir: string
  runId: string
  result: ReconciliationResult
}): Promise<string> => {
  const snapshotDir = join(options.stateDir, 'runs', options.runId)
  const targets = guidanceTargets(options)
  await createGuidanceSnapshot({ snapshotDir, targets })
  const writes: [string, string][] = [
    [targets['canonical/shared.md'], options.result.shared],
    [targets['canonical/claude-overlay.md'], options.result.claudeOverlay],
    [targets['canonical/codex-overlay.md'], options.result.codexOverlay],
    [targets['live/claude/CLAUDE.md'], options.result.claudeDocument],
    [targets['live/codex/AGENTS.md'], options.result.codexDocument],
    [
      targets['state/accepted.json'],
      `${JSON.stringify({ runId: options.runId, acceptedAt: new Date().toISOString(), inputHashes: options.result.inputHashes, outputHashes: { shared: sha256Text(options.result.shared), claudeOverlay: sha256Text(options.result.claudeOverlay), codexOverlay: sha256Text(options.result.codexOverlay), claudeDocument: sha256Text(options.result.claudeDocument), codexDocument: sha256Text(options.result.codexDocument) } }, null, 2)}\n`,
    ],
  ]
  try {
    for (const [target, content] of writes)
      await writeGuidanceAtomically(target, content)
    await mkdir(snapshotDir, { recursive: true, mode: 0o700 })
    await writeFile(join(snapshotDir, 'complete'), '', {
      mode: 0o600,
      flag: 'wx',
    })
    const completeHandle = await open(join(snapshotDir, 'complete'), 'r')
    try {
      await completeHandle.sync()
    } finally {
      await completeHandle.close()
    }
    await chmod(join(snapshotDir, 'complete'), 0o400)
    const runDirectoryHandle = await open(snapshotDir, 'r')
    try {
      await runDirectoryHandle.sync()
    } finally {
      await runDirectoryHandle.close()
    }
    return snapshotDir
  } catch (error) {
    try {
      await restoreGuidanceSnapshot(snapshotDir, targets)
    } catch (rollbackError) {
      throw new Error(
        `guidance apply failed and rollback failed: ${rollbackError instanceof Error ? rollbackError.message : 'unknown rollback error'}`,
        { cause: rollbackError },
      )
    }
    throw error
  }
}
