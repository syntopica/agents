import { tokenize } from '../analyzers/tokenize'
import { ACTION_WORDS } from '../constants/ACTION_WORDS'

export const descriptionSpecificityWarning = (description: string) => {
  const words = tokenize(description)
  if (words.length < 8) {
    return 'description may be too short; expected >= 8 words for reliable activation'
  }

  const hasActionWord = words.some((word: string) => ACTION_WORDS.has(word))
  if (!hasActionWord) {
    return 'description may be too generic; include action terms like split/extract/refactor/fix'
  }

  return null
}
