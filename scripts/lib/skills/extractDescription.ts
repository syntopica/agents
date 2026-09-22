/**
 * Pull the description value out of a frontmatter block as a single line.
 *
 * Collapsing whitespace matters: the formatter wraps long descriptions, so a
 * phrase like "Do not use" can land as "Do\n  not use" and defeat a naive regex.
 * Matching against the raw block would also let other fields satisfy checks that
 * are meant to apply to the description alone.
 *
 * @param {string} frontmatter - Raw text between the --- fences.
 * @returns {string} - Description on one line, or "" when absent.
 */
export const extractDescription = (frontmatter: string): string => {
  const lines = frontmatter.split('\n')
  const start = lines.findIndex((line) => line.startsWith('description:'))
  if (start === -1) return ''

  const parts = [lines[start]?.replace(/^description:\s*[|>-]?\s*/, '') ?? '']
  for (const line of lines.slice(start + 1)) {
    if (/^\S/.test(line)) break
    parts.push(line.trim())
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim()
}
