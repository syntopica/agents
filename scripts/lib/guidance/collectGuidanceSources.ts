import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { sha256Text } from './sha256Text'
import type { GuidanceSources } from './types/GuidanceSources'

export const collectGuidanceSources = async (options: {
  home: string
  canonicalDir: string
  stateDir: string
  rulesInventoryPath?: string
}): Promise<GuidanceSources> => {
  const values: Record<string, string> = {}
  const readOptionalText = async (path: string): Promise<string> => {
    if (path === '') return ''
    try {
      return await readFile(path, 'utf8')
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return ''
      throw error
    }
  }
  const add = async (key: string, path: string) => {
    values[key] = await readOptionalText(path)
  }
  await Promise.all([
    add('canonical/shared.md', join(options.canonicalDir, 'shared.md')),
    add(
      'canonical/claude-overlay.md',
      join(options.canonicalDir, 'claude-overlay.md'),
    ),
    add(
      'canonical/codex-overlay.md',
      join(options.canonicalDir, 'codex-overlay.md'),
    ),
    add('live/claude/CLAUDE.md', join(options.home, '.claude', 'CLAUDE.md')),
    add('live/codex/AGENTS.md', join(options.home, '.codex', 'AGENTS.md')),
    add('state/accepted.json', join(options.stateDir, 'accepted.json')),
    add(
      'generated/rules-inventory',
      options.rulesInventoryPath ??
        join(process.cwd(), 'dist', 'markdown', 'CLAUDE.md'),
    ),
  ])
  const rulesDir = join(options.home, '.claude', 'rules')
  try {
    for (const entry of await readdir(rulesDir, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith('.md'))
        await add(`claude-rules/${entry.name}`, join(rulesDir, entry.name))
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
  const hashes = Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, sha256Text(value)]),
  )
  return { values, hashes }
}
