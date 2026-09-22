import { constants } from 'node:fs'
import { chmod, copyFile, lstat, mkdir } from 'node:fs/promises'
import { join } from 'node:path'

export const stageAgentBootstrapFiles = async (
  sourcePaths: string[],
  scratchDir: string,
): Promise<string | undefined> => {
  if (sourcePaths.length === 0) return undefined
  const bootstrapDir = join(scratchDir, 'bootstrap')
  await mkdir(bootstrapDir, { mode: 0o700 })
  await chmod(bootstrapDir, 0o700)
  for (const [index, sourcePath] of sourcePaths.entries()) {
    const source = await lstat(sourcePath)
    if (
      !source.isFile() ||
      source.isSymbolicLink() ||
      (source.mode & 0o077) !== 0
    )
      throw new Error('agent bootstrap source has unsafe metadata')
    if (process.getuid !== undefined && source.uid !== process.getuid())
      throw new Error('agent bootstrap source has an unsafe owner')
    const destination = join(bootstrapDir, String(index))
    await copyFile(sourcePath, destination, constants.COPYFILE_EXCL)
    await chmod(destination, 0o600)
  }
  return bootstrapDir
}
