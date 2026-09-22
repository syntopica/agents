import { CODEX_SKILL_READ_PATTERNS } from './constants/CODEX_SKILL_READ_PATTERNS'

export const readCodexSkillReads = (contents: string) => {
  const counts: Record<string, number> = {}

  for (const pattern of CODEX_SKILL_READ_PATTERNS) {
    for (const match of contents.matchAll(pattern)) {
      const skill = match[1]

      if (skill === undefined) {
        continue
      }

      counts[skill] = (counts[skill] ?? 0) + 1
    }
  }

  return counts
}
