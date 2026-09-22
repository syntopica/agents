export const parseMdc = (content: string) => {
  const trimmed = content.trimStart()
  if (!trimmed.startsWith('---')) {
    return { frontmatter: null, body: content.trimEnd() }
  }

  const lines = trimmed.split('\n')
  if (lines[0] !== '---') {
    return { frontmatter: null, body: content.trimEnd() }
  }

  let closingIndex = -1
  for (let index = 1; index < lines.length; index += 1) {
    if (lines[index] === '---') {
      closingIndex = index
      break
    }
  }

  if (closingIndex === -1) {
    return { frontmatter: null, body: content.trimEnd() }
  }

  const frontmatterLines = lines.slice(1, closingIndex)
  const body = lines
    .slice(closingIndex + 1)
    .join('\n')
    .trimStart()
    .trimEnd()
  const frontmatter: Record<string, string> = {}

  for (const line of frontmatterLines) {
    const separatorIndex = line.indexOf(':')
    if (separatorIndex === -1) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim()
    const value = line.slice(separatorIndex + 1).trim()
    frontmatter[key] = value.replace(/^"(.*)"$/, '$1')
  }

  return { frontmatter, body }
}
