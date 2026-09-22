import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

export const createSessionRollout = async (
  sessionsDir: string,
  relativePath: string,
): Promise<string> => {
  const path = join(sessionsDir, relativePath)
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, '{"type":"session_meta","payload":{"id":"fixture"}}\n')
  return path
}
