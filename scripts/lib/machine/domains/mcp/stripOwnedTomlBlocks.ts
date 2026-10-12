import { CODEX_SECTION_PATTERN } from './constants/CODEX_SECTION_PATTERN'

/**
 * Removes every `[mcp_servers.<name>]` table whose name is in `drop`.
 *
 * Comments and blank lines after a dropped table are held back until the next
 * header: they belong to whatever follows, so they are kept when that table is
 * kept. Dropping them with the table once removed the `# BEGIN` fence of the
 * generated skills trim, and every later `skills:link` appended another copy.
 */
export const stripOwnedTomlBlocks = (contents: string, drop: Set<string>) => {
  const kept: string[] = []
  let held: string[] = []
  let dropping = false

  for (const line of contents.split('\n')) {
    const trimmed = line.trim()

    if (trimmed.startsWith('[')) {
      const name = CODEX_SECTION_PATTERN.exec(trimmed)?.[1]
      dropping = name !== undefined && drop.has(name)
      if (!dropping) kept.push(...held)
      held = []
    } else if (dropping && (trimmed === '' || trimmed.startsWith('#'))) {
      held.push(line)
      continue
    } else if (dropping) {
      held = []
    }

    if (!dropping) {
      kept.push(line)
    }
  }

  return kept.join('\n').trimEnd()
}
