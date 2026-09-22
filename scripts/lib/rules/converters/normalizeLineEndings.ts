/** Normalize line endings to \\n for stable diffs and cross-platform consistency. */
export function normalizeLineEndings(content: string) {
  return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}
