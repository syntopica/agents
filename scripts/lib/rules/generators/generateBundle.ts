import { promises as fs } from 'node:fs'
import path from 'node:path'
import { parseMdc } from '../parsers/parseMdc'

export const generateBundle = async (
  sourceFiles: string[],
  sourceDir: string,
) => {
  const mdcFiles = sourceFiles
    .filter((filePath: string) => filePath.endsWith('.mdc'))
    .sort((a: string, b: string) => a.localeCompare(b))

  const items = []

  for (const filePath of mdcFiles) {
    const relativePath = path.relative(sourceDir, filePath)
    const content = await fs.readFile(filePath, 'utf8')
    const parsed = parseMdc(content)

    items.push({
      rel: relativePath,

      frontmatter: parsed.frontmatter ?? {},
      content: parsed.body || content.trimEnd(),
    })
  }

  return items
}
