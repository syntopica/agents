import { stat } from 'node:fs/promises'
import { join } from 'node:path'
import { listCodexRollouts } from '../library/learning/listCodexRollouts'
import { CODEX_DATABASES } from './constants/CODEX_DATABASES'
import { readRolloutHeader } from './readRolloutHeader'
import { runSqliteIntegrityCheck } from './runSqliteIntegrityCheck'
import type { CodexStateReport } from './types/CodexStateReport'

export const inspectCodexState = async (
  codexDir: string,
): Promise<CodexStateReport> => {
  const databases = await Promise.all(
    CODEX_DATABASES.map((name) =>
      runSqliteIntegrityCheck(join(codexDir, name)),
    ),
  )
  const rolloutPaths = (
    await listCodexRollouts(join(codexDir, 'sessions'))
  ).toSorted((left, right) => left.localeCompare(right))
  const sessionStats = await Promise.all(rolloutPaths.map((path) => stat(path)))
  const findings = await Promise.all(
    rolloutPaths.map(async (path) => {
      try {
        return await readRolloutHeader(path)
      } catch {
        return {
          path,
          status: 'malformed' as const,
          summary: 'session is unreadable',
        }
      }
    }),
  )

  return {
    codexDir,
    databases,
    sessionCount: rolloutPaths.length,
    sessionBytes: sessionStats.reduce(
      (total, current) => total + current.size,
      0,
    ),
    malformedSessions: findings.filter(({ status }) => status === 'malformed'),
  }
}
