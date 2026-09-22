import { isContinuationPhrase } from './isContinuationPhrase'
import { mightCarrySecret } from './mightCarrySecret'
import type { ObservedTurn } from './types/ObservedTurn'

export const collectTriggerPhrases = (
  turns: ObservedTurn[],
  maxLength: number,
) => {
  const phrases: Record<string, string[]> = {}
  let previous: string | undefined

  for (const turn of turns) {
    if (turn.invokedSkill === undefined) {
      previous = turn.text
      continue
    }

    if (
      previous === undefined ||
      previous.length > maxLength ||
      isContinuationPhrase(previous) ||
      mightCarrySecret(previous)
    ) {
      continue
    }

    phrases[turn.invokedSkill] ??= []
    const seen = phrases[turn.invokedSkill]

    if (seen !== undefined && !seen.includes(previous)) {
      seen.push(previous)
    }
  }

  return phrases
}
