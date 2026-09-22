import { skillNameTokens } from './skillNameTokens'
import { tokenizeProcedureName } from './tokenizeProcedureName'
import type { CoverGuess } from './types/CoverGuess'
import type { SkillCatalogEntry } from './types/SkillCatalogEntry'

export const guessCoveringSkill = (
  procedure: string,
  catalog: SkillCatalogEntry[],
): CoverGuess | undefined => {
  const tokens = tokenizeProcedureName(procedure)

  if (tokens.length === 0) {
    return undefined
  }

  let best: CoverGuess | undefined

  for (const entry of catalog) {
    const haystack = entry.text.toLowerCase()
    const nameTokens = skillNameTokens(entry.key)

    const namesSkill = tokens.some((token) => nameTokens.includes(token))
    const hits = tokens.filter((token) => haystack.includes(token)).length
    const score = namesSkill
      ? Math.max(hits / tokens.length, 0.5)
      : hits / tokens.length

    if (score >= 0.5 && (best === undefined || score > best.score)) {
      best = { skill: entry.key, score }
    }
  }

  return best
}
