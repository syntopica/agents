import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export const createRollout = async (contents: string): Promise<string> => {
  const root = await mkdtemp(join(tmpdir(), 'codex-rollout-'))
  const path = join(root, 'rollout.jsonl')
  await writeFile(path, contents)
  return path
}
