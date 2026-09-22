import { parseMdc } from '../parsers/parseMdc'

export const toClaudeRule = (content: string) => {
  const { frontmatter, body } = parseMdc(content)

  if (!frontmatter) {
    return content.trimEnd()
  }

  const globs = (frontmatter['globs'] ?? '')
    .split(',')
    .map((value: string) => value.trim())
    .filter(Boolean)
    .filter((value: string) => value !== '*')

  if (globs.length === 0) {
    return body
  }

  const pathLines = globs.map((glob: string) => `  - "${glob}"`).join('\n')
  return `---\npaths:\n${pathLines}\n---\n\n${body}`
}
