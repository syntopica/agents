export function extractShortSummaryLine(content?: string) {
  const text = content ?? ''

  // Use string methods to avoid ReDoS
  const lower = text.toLowerCase()
  const startIdx = lower.indexOf('## short summary')
  if (startIdx === -1) return ''

  const afterHeader = text.substring(startIdx)
  const newlineIdx = afterHeader.indexOf('\n')
  if (newlineIdx === -1) return ''

  const body = afterHeader.substring(newlineIdx + 1)
  let endIdx = body.length

  const nextH2 = body.indexOf('\n## ')
  const nextH1 = body.indexOf('\n# ')

  if (nextH2 !== -1 && nextH1 !== -1) {
    endIdx = Math.min(nextH2, nextH1)
  } else if (nextH2 !== -1) {
    endIdx = nextH2
  } else if (nextH1 !== -1) {
    endIdx = nextH1
  }

  const block = body.substring(0, endIdx)

  const lines = block
    .split('\n')
    .map((l: string) => l.trim())
    .filter(Boolean)
  const bullet = lines.find(
    (l: string) => l.startsWith('- ') || l.startsWith('* '),
  )
  if (bullet) return bullet.replace(/^[-*]\s+/, '')

  return lines[0] ?? ''
}
