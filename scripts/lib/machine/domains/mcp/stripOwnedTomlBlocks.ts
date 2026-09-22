import { CODEX_SECTION_PATTERN } from './constants/CODEX_SECTION_PATTERN'

export const stripOwnedTomlBlocks = (contents: string, drop: Set<string>) => {
  const kept: string[] = []
  let dropping = false

  for (const line of contents.split('\n')) {
    const trimmed = line.trim()

    if (trimmed.startsWith('[')) {
      const name = CODEX_SECTION_PATTERN.exec(trimmed)?.[1]
      dropping = name !== undefined && drop.has(name)
    }

    if (!dropping) {
      kept.push(line)
    }
  }

  return kept.join('\n').trimEnd()
}
