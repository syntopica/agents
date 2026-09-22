export const parsePortabilityFrontmatter = (
  frontmatter: string,
): { fields: Map<string, string>; errors: string[] } => {
  const fields = new Map<string, string>()
  const errors: string[] = []
  for (const [index, line] of frontmatter.split(/\r?\n/).entries()) {
    if (
      line.trim() === '' ||
      line.trimStart().startsWith('#') ||
      /^\s/.test(line)
    )
      continue
    const colonIndex = line.indexOf(':')
    const key = colonIndex > 0 ? line.slice(0, colonIndex) : ''
    if (!/^[A-Za-z0-9_-]+$/.test(key)) {
      errors.push(`line ${String(index + 1)} is not a top-level YAML field`)
      continue
    }
    if (fields.has(key)) errors.push(`${key} is declared more than once`)
    fields.set(key, line.slice(colonIndex + 1).trim())
  }
  return { fields, errors }
}
