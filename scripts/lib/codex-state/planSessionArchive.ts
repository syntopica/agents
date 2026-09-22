import { stat } from 'node:fs/promises'
import { relative } from 'node:path'
import { listCodexRollouts } from '../library/learning/listCodexRollouts'
import { parseRolloutTimestamp } from './parseRolloutTimestamp'
import type { ArchivePlan } from './types/ArchivePlan'
import type { ArchivePlanEntry } from './types/ArchivePlanEntry'
import type { ArchivePolicy } from './types/ArchivePolicy'

export const planSessionArchive = async (
  sessionsDir: string,
  policy: ArchivePolicy,
): Promise<ArchivePlan> => {
  if (!Number.isFinite(policy.retentionDays) || policy.retentionDays < 0) {
    throw new Error('retentionDays must be a non-negative number')
  }
  const cutoff = policy.now.getTime() - policy.retentionDays * 86_400_000
  const entries: ArchivePlanEntry[] = []
  const skippedMalformed: string[] = []
  const rolloutPaths = (await listCodexRollouts(sessionsDir)).toSorted(
    (left, right) => left.localeCompare(right),
  )

  for (const sourcePath of rolloutPaths) {
    const relativePath = relative(sessionsDir, sourcePath)
    const timestamp = parseRolloutTimestamp(relativePath)
    if (timestamp === undefined) {
      skippedMalformed.push(relativePath)
      continue
    }
    const currentMonth =
      timestamp.getUTCFullYear() === policy.now.getUTCFullYear() &&
      timestamp.getUTCMonth() === policy.now.getUTCMonth()
    if (currentMonth || timestamp.getTime() >= cutoff) continue
    entries.push({
      sourcePath,
      relativePath,
      bytes: (await stat(sourcePath)).size,
      timestamp: timestamp.toISOString(),
    })
  }

  return {
    sessionsDir,
    entries,
    totalBytes: entries.reduce((total, entry) => total + entry.bytes, 0),
    skippedMalformed,
  }
}
