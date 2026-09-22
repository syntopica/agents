import { open } from 'node:fs/promises'
import type { GuidanceLockObservation } from './types/GuidanceLockObservation'

export const readGuidanceLockObservation = async (
  lockPath: string,
  staleAfterMs: number,
): Promise<GuidanceLockObservation | undefined> => {
  let handle
  try {
    handle = await open(lockPath, 'r')
    const [owner, metadata] = await Promise.all([
      handle.readFile('utf8'),
      handle.stat(),
    ])
    const ageMs = Date.now() - metadata.mtimeMs
    let active = ageMs <= staleAfterMs
    try {
      const parsed = JSON.parse(owner) as unknown
      const pid =
        typeof parsed === 'object' && parsed !== null
          ? (parsed as { pid?: unknown }).pid
          : undefined
      if (typeof pid === 'number' && Number.isSafeInteger(pid) && pid > 0)
        try {
          process.kill(pid, 0)
          active = true
        } catch (error) {
          active = (error as NodeJS.ErrnoException).code === 'EPERM'
        }
    } catch {
      // Legacy lock contents use the bounded age fallback.
    }
    return { active, owner, device: metadata.dev, inode: metadata.ino }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined
    throw new Error('could not inspect guidance lock', { cause: error })
  } finally {
    await handle?.close()
  }
}
