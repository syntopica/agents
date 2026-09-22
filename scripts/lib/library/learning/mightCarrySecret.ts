import { SECRET_MARKERS } from './constants/SECRET_MARKERS'
import { looksLikeRandomToken } from './looksLikeRandomToken'

export const mightCarrySecret = (text: string) => {
  if (SECRET_MARKERS.some((marker) => marker.test(text))) {
    return true
  }

  return text.split(/\s+/).some(looksLikeRandomToken)
}
