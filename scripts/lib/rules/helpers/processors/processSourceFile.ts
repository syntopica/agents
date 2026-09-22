import { promises as fs } from 'node:fs'
import path from 'node:path'
import { parseMdc } from '../../parsers/parseMdc'

/**
 * Process a single source file: read, parse, and get relative path
 * @param {string} file - File path
 * @param {string} sourceDir - Source directory
 * @returns {Promise<{content: string, parsed: object, relativePath: string}>}
 */
export async function processSourceFile(file: string, sourceDir: string) {
  const content = await fs.readFile(file, 'utf8')
  const parsed = parseMdc(content)
  const relativePath = path.relative(sourceDir, file)

  const parsedWithContent = { ...parsed, content: parsed.body }
  return { content, parsed: parsedWithContent, relativePath }
}
