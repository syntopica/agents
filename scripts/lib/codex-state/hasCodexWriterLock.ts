import { readdir } from 'node:fs/promises'
import { join } from 'node:path'

export const hasCodexWriterLock = async (
  codexDir: string,
): Promise<boolean> => {
  try {
    const entries = await readdir(join(codexDir, 'thread-writer-locks'))
    return entries.some(
      (entry) => entry.endsWith('.lock') && entry !== '.coordination.lock',
    )
  } catch {
    return false
  }
}
