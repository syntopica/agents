import { writeFile } from 'node:fs/promises'
import { createGuidanceLockRelease } from './createGuidanceLockRelease'
import { readGuidanceLockObservation } from './readGuidanceLockObservation'
import { reclaimGuidanceLock } from './reclaimGuidanceLock'

export const acquireGuidanceLock = async (
  lockPath: string,
  runId: string,
  staleAfterMs: number,
): Promise<() => Promise<void>> => {
  const owner = `${JSON.stringify({ pid: process.pid, runId })}\n`
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      await writeFile(lockPath, owner, {
        encoding: 'utf8',
        flag: 'wx',
        mode: 0o600,
      })
      return createGuidanceLockRelease(lockPath, owner)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST')
        throw new Error('could not acquire guidance lock', { cause: error })
    }
    const observed = await readGuidanceLockObservation(lockPath, staleAfterMs)
    if (observed === undefined) continue
    if (observed.active)
      throw new Error('a guidance reconciliation run is already active')
    const release = await reclaimGuidanceLock(
      lockPath,
      `${lockPath}.recovery`,
      observed,
      owner,
      staleAfterMs,
    )
    if (release !== undefined) return release
  }
  throw new Error('could not acquire guidance lock')
}
