import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export const createTempConfigFile = async (name: string, contents: string) => {
  const dir = await mkdtemp(join(tmpdir(), 'machine-fixture-'))
  const path = join(dir, name)
  await writeFile(path, contents)
  return path
}
