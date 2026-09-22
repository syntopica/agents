import { writeFile } from 'node:fs/promises'
import { createGuidanceLockRelease } from './createGuidanceLockRelease'
import { isSameGuidanceLock } from './isSameGuidanceLock'
import { readGuidanceLockObservation } from './readGuidanceLockObservation'
import type { GuidanceLockObservation } from './types/GuidanceLockObservation'

export const reclaimGuidanceLock = async (
  lockPath: string,
  recoveryPath: string,
  observed: GuidanceLockObservation,
  owner: string,
  staleAfterMs: number,
): Promise<(() => Promise<void>) | undefined> => {
  let releaseRecovery: (() => Promise<void>) | undefined
  try {
    try {
      await writeFile(recoveryPath, owner, {
        encoding: 'utf8',
        flag: 'wx',
        mode: 0o600,
      })
      releaseRecovery = createGuidanceLockRelease(recoveryPath, owner)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST')
        throw new Error('could not claim stale guidance lock', { cause: error })
      const recovery = await readGuidanceLockObservation(
        recoveryPath,
        staleAfterMs,
      )
      if (recovery?.active === true) return undefined
      if (recovery !== undefined)
        await createGuidanceLockRelease(recoveryPath, recovery.owner)()
      return undefined
    }
    const current = await readGuidanceLockObservation(lockPath, staleAfterMs)
    if (
      current === undefined ||
      current.active ||
      !isSameGuidanceLock(observed, current)
    )
      return undefined
    await createGuidanceLockRelease(lockPath, current.owner)()
    try {
      await writeFile(lockPath, owner, {
        encoding: 'utf8',
        flag: 'wx',
        mode: 0o600,
      })
      return createGuidanceLockRelease(lockPath, owner)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EEXIST') return undefined
      throw new Error('could not replace stale guidance lock', { cause: error })
    }
  } catch (error) {
    throw new Error('could not recover stale guidance lock', { cause: error })
  } finally {
    await releaseRecovery?.()
  }
}
