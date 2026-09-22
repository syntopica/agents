import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { McpTarget } from '../types/McpTarget'

export const createTempTargetPaths = async (): Promise<
  Record<McpTarget, string>
> => {
  const dir = await mkdtemp(join(tmpdir(), 'machine-idem-'))
  const paths: Record<McpTarget, string> = {
    'claude-personal': join(dir, 'claude.json'),
    'claude-secondary': join(dir, 'secondary.json'),
    codex: join(dir, 'config.toml'),
    gemini: join(dir, 'gemini.json'),
    cursor: join(dir, 'cursor.json'),
  }

  await writeFile(
    paths['claude-personal'],
    JSON.stringify({ theme: 'dark', mcpServers: {} }),
  )
  await writeFile(paths['claude-secondary'], '{}')
  await writeFile(paths.codex, 'model = "gpt-5.6-sol"\n')
  await writeFile(paths.gemini, '')
  await writeFile(paths.cursor, '{}')

  return paths
}
