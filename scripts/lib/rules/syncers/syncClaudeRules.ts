import { promises as fs } from 'node:fs'
import path from 'node:path'
import { ensureDir } from '../../fs/operations/ensureDir'
import { normalizeRel } from '../converters/normalizeRel'
import { toClaudeRule } from '../converters/toClaudeRule'

export const syncClaudeRules = async (
  sourceFiles: string[],
  sourceDir: string,
  claudeRulesDir: string,
) => {
  await fs.rm(claudeRulesDir, { recursive: true, force: true })
  await ensureDir(claudeRulesDir)

  const mdcFiles = sourceFiles
    .filter((sourcePath: string) => sourcePath.endsWith('.mdc'))
    .sort((a: string, b: string) => a.localeCompare(b))

  for (const sourcePath of mdcFiles) {
    const relativePath = normalizeRel(
      path.relative(sourceDir, sourcePath),
    ).replace(/\.mdc$/, '.md')
    const targetPath = path.join(claudeRulesDir, relativePath)
    const sourceContent = await fs.readFile(sourcePath, 'utf8')

    const claudeContent = `${toClaudeRule(sourceContent)}\n`

    await ensureDir(path.dirname(targetPath))
    await fs.writeFile(targetPath, claudeContent, 'utf8')
  }
}
