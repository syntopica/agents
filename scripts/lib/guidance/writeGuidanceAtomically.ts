import { chmod, mkdir, open, rename, unlink } from 'node:fs/promises'
import { dirname, join } from 'node:path'

export const writeGuidanceAtomically = async (
  target: string,
  content: string,
): Promise<void> => {
  const directory = dirname(target)
  await mkdir(directory, { recursive: true, mode: 0o700 })
  const temporary = join(
    directory,
    `.${process.pid.toString(36)}-${crypto.randomUUID()}.guidance.tmp`,
  )
  const handle = await open(temporary, 'wx', 0o600)
  try {
    await handle.writeFile(content, 'utf8')
    await handle.sync()
  } finally {
    await handle.close()
  }
  try {
    await rename(temporary, target)
    await chmod(target, 0o600)
    const directoryHandle = await open(directory, 'r')
    try {
      await directoryHandle.sync()
    } finally {
      await directoryHandle.close()
    }
  } catch (error) {
    await unlink(temporary).catch(() => undefined)
    throw error
  }
}
