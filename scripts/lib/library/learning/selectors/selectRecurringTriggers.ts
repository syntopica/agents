import { skillNameTokens } from '../skillNameTokens'
import { tokenizeTriggerPhrase } from '../tokenizeTriggerPhrase'
import type { RecurringTriggerSplit } from '../types/RecurringTriggerSplit'

export const selectRecurringTriggers = (
  phrases: Record<string, string[]>,
): RecurringTriggerSplit => {
  const kept: Record<string, string[]> = {}
  const dropped: Record<string, string[]> = {}

  for (const [skill, list] of Object.entries(phrases)) {
    const nameTokens = skillNameTokens(skill)
    const tokenized = list.map((phrase) => ({
      phrase,
      tokens: tokenizeTriggerPhrase(phrase),
    }))

    const seenIn: Record<string, number> = {}
    for (const { tokens } of tokenized) {
      for (const token of new Set(tokens)) {
        seenIn[token] = (seenIn[token] ?? 0) + 1
      }
    }

    for (const { phrase, tokens } of tokenized) {
      const namesSkill = tokens.some((token) =>
        nameTokens.some((name) => token.includes(name) || name.includes(token)),
      )
      const recurs = tokens.some((token) => (seenIn[token] ?? 0) >= 2)

      const bucket = namesSkill || (list.length > 1 && recurs) ? kept : dropped
      const target = (bucket[skill] ??= [])
      target.push(phrase)
    }
  }

  return { kept, dropped }
}
