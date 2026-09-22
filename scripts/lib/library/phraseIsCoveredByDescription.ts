import { CONTINUATION_TOKENS } from './learning/constants/CONTINUATION_TOKENS'

export const phraseIsCoveredByDescription = (
  phrase: string,
  description: string,
) => {
  const haystack = description.toLowerCase()

  const words = phrase
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 3 && !CONTINUATION_TOKENS.has(word))

  if (words.length === 0) {
    return true
  }

  const hits = words.filter((word) => haystack.includes(word)).length

  return hits / words.length >= 0.4
}
