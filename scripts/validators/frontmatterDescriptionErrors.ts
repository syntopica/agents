/**
 * Check a SKILL.md frontmatter block for a description that will not survive
 * YAML parsing, or that is missing entirely.
 *
 * This does not implement YAML. It targets the one construct that silently broke
 * a shipped skill: a plain (unquoted) multi-line scalar whose continuation lines
 * contain `colon + space`, which makes the value ambiguous. The parser gives up,
 * the description reads as empty, and the skill can never be selected by
 * description - with no warning anywhere.
 *
 * @param {string} frontmatter - Raw text between the --- fences.
 * @returns {string[]} - Human-readable errors; empty when the description is sound.
 */
export const frontmatterDescriptionErrors = (frontmatter: string): string[] => {
  const errors: string[] = []
  const lines = frontmatter.split('\n')
  const start = lines.findIndex((line) => line.startsWith('description:'))

  if (start === -1) {
    errors.push('frontmatter has no description field')
    return errors
  }

  const inline = lines[start]?.replace(/^description:\s*/, '').trim() ?? ''
  const isBlockScalar = /^[|>]/.test(inline)

  const continuation: string[] = []
  for (const line of lines.slice(start + 1)) {
    if (/^\S/.test(line)) break
    continuation.push(line)
  }

  if (inline === '' && continuation.length === 0) {
    errors.push('description is empty')
    return errors
  }

  // A block scalar (| or >) takes everything literally, so colons are safe there.
  if (isBlockScalar) return errors

  const quoted = /^["']/.test(inline)
  if (quoted) return errors

  for (const line of continuation) {
    if (line.includes(': ')) {
      errors.push(
        `description is a plain multi-line scalar containing ": " which YAML cannot parse: ` +
          `"${line.trim().slice(0, 60)}". Rephrase without the colon, or use a > block scalar.`,
      )
      break
    }
  }

  return errors
}
