import { extractDescription } from '../../skills/extractDescription'

export const renderCodexAgent = (markdown: string): string => {
  if (!markdown.startsWith('---\n'))
    throw new Error('agent definition is missing frontmatter')
  const fenceEnd = markdown.indexOf('\n---\n', 4)
  if (fenceEnd === -1)
    throw new Error('agent definition is missing frontmatter')

  const frontmatter = markdown.slice(4, fenceEnd)
  const instructions = markdown.slice(fenceEnd + 5).trim()
  const name =
    frontmatter
      .split('\n')
      .find((line) => line.startsWith('name:'))
      ?.slice('name:'.length)
      .trim() ?? ''
  const description = extractDescription(frontmatter)

  if (!name) throw new Error('agent definition is missing name')
  if (!description) throw new Error(`agent ${name} is missing description`)
  if (!instructions) throw new Error(`agent ${name} is missing instructions`)

  return [
    `name = ${JSON.stringify(name)}`,
    `description = ${JSON.stringify(description)}`,
    `developer_instructions = ${JSON.stringify(instructions)}`,
    '',
  ].join('\n')
}
