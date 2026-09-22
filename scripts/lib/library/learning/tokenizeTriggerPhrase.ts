import { CONTINUATION_TOKENS } from './constants/CONTINUATION_TOKENS'

export const tokenizeTriggerPhrase = (phrase: string) =>
  phrase
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 3 && !CONTINUATION_TOKENS.has(token))
