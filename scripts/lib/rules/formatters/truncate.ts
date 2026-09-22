import { MAX_DESCRIPTION_CHARS } from '../constants/MAX_DESCRIPTION_CHARS'

export function truncate(value: string, max: number) {
  const limit = Number.isFinite(max) ? max : MAX_DESCRIPTION_CHARS
  if (limit <= 0) return ''
  if (value.length <= limit) return value
  if (limit === 1) return '…'
  const cut = value.slice(0, limit - 1)
  const lastSpace = cut.lastIndexOf(' ')
  const safe = lastSpace > 40 ? cut.slice(0, lastSpace) : cut
  return `${safe.trimEnd()}…`
}
