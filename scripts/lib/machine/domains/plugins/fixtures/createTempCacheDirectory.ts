import { mkdir, mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export const createTempCacheDirectory = async (directories: string[][]) => {
  const cacheDir = await mkdtemp(join(tmpdir(), 'plugins-cache-'))

  for (const segments of directories) {
    await mkdir(join(cacheDir, ...segments), { recursive: true })
  }

  return cacheDir
}
