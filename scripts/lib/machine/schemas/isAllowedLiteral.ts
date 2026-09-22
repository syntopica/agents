import { SCHEME_URL } from './constants/SCHEME_URL'
import { SUSPICIOUS_PREFIX } from './constants/SUSPICIOUS_PREFIX'
import { TRANSPORT_WORDS } from './constants/TRANSPORT_WORDS'
import { USERINFO_URL } from './constants/USERINFO_URL'
import { UUID_PATTERN } from './constants/UUID_PATTERN'
import { isHighEntropy } from './isHighEntropy'

export const isAllowedLiteral = (value: string) => {
  if (
    SUSPICIOUS_PREFIX.test(value) ||
    USERINFO_URL.test(value) ||
    UUID_PATTERN.test(value)
  ) {
    return false
  }

  if (value.startsWith('-') || TRANSPORT_WORDS.has(value)) {
    return true
  }

  if (SCHEME_URL.test(value)) {
    return true
  }

  return !isHighEntropy(value)
}
