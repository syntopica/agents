export const extractTurnText = (content: unknown) => {
  if (typeof content === 'string') {
    return content
  }

  if (!Array.isArray(content)) {
    return ''
  }

  const texts: string[] = []

  for (const block of content) {
    if (typeof block !== 'object' || block === null) {
      continue
    }

    const record = block as Record<string, unknown>
    if (record['type'] === 'text' && typeof record['text'] === 'string') {
      texts.push(record['text'])
    }
  }

  return texts.join(' ')
}
