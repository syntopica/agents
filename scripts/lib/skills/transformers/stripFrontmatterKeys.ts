export const stripFrontmatterKeys = (
  frontmatter: string,
  keysToStrip: readonly string[],
): string => {
  const stripSet = new Set<string>(keysToStrip)
  const lines = frontmatter.split('\n')
  const output: string[] = []
  let skipUntilNextKey = false

  for (const line of lines) {
    const keyMatch = /^([A-Za-z_][\w-]*):/.exec(line)
    const key = keyMatch?.[1]
    if (key !== undefined) {
      if (stripSet.has(key)) {
        skipUntilNextKey = true
        continue
      }
      skipUntilNextKey = false
      output.push(line)
      continue
    }
    if (skipUntilNextKey) continue
    output.push(line)
  }

  return output.join('\n')
}
