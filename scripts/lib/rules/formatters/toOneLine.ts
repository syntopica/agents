export function toOneLine(value?: string) {
  const s = (value ?? '').trim()
  if (!s) return ''
  return s.replace(/\s+/g, ' ')
}
