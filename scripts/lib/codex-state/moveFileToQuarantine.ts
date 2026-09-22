import { constants } from 'node:fs'
import { copyFile, rename, unlink } from 'node:fs/promises'
import { hashFile } from './hashFile'

export const moveFileToQuarantine = async (
  sourcePath: string,
  destinationPath: string,
  expectedHash: string,
): Promise<void> => {
  try {
    await rename(sourcePath, destinationPath)
  } catch (error: unknown) {
    const code =
      error instanceof Error && 'code' in error ? error.code : undefined
    if (code !== 'EXDEV') throw error
    await copyFile(sourcePath, destinationPath, constants.COPYFILE_EXCL)
    if ((await hashFile(destinationPath)) !== expectedHash) {
      throw new Error('quarantine copy verification failed', { cause: error })
    }
    await unlink(sourcePath)
  }
}
