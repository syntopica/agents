import { readFile, rm } from 'node:fs/promises'

export const createGuidanceLockRelease =
  (lockPath: string, owner: string): (() => Promise<void>) =>
  async () => {
    try {
      if ((await readFile(lockPath, 'utf8')) === owner) await rm(lockPath)
    } catch {
      // A missing or replaced lock is not owned by this process.
    }
  }
