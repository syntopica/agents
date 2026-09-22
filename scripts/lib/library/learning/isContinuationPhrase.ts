import { CONTINUATION_TOKENS } from './constants/CONTINUATION_TOKENS'

export const isContinuationPhrase = (text: string) => {
  const trimmed = text.trim()

  if (trimmed.length < 12 || trimmed.startsWith('[Image:')) {
    return true
  }

  const tokens = trimmed
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((token) => token !== '')

  if (tokens.length === 0) {
    return true
  }

  return tokens.every(
    (token) => CONTINUATION_TOKENS.has(token) || /^\d+$/.test(token),
  )
}
