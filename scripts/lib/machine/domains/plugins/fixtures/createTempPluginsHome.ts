import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export const createTempPluginsHome = async (files: Record<string, string>) => {
  const home = await mkdtemp(join(tmpdir(), 'plugins-fixture-'))

  for (const [relative, contents] of Object.entries(files)) {
    const path = join(home, relative)
    await mkdir(join(path, '..'), { recursive: true })
    await writeFile(path, contents)
  }

  return home
}
