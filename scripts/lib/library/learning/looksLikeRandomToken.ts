import { IDENTIFIER_SYMBOLS } from './constants/IDENTIFIER_SYMBOLS'

export const looksLikeRandomToken = (token: string) => {
  if (token.length < 12 || token.length > 128) {
    return false
  }

  let lower = false
  let upper = false
  let digit = false
  let symbol = false

  for (const character of token) {
    if (character >= 'a' && character <= 'z') lower = true
    else if (character >= 'A' && character <= 'Z') upper = true
    else if (character >= '0' && character <= '9') digit = true
    else if (!IDENTIFIER_SYMBOLS.has(character)) symbol = true
  }

  if (!digit) {
    return false
  }

  return [lower, upper, digit, symbol].filter(Boolean).length >= 3
}
