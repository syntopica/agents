import { promises as fs } from 'node:fs'
import path from 'node:path'
import { listFilesRecursive } from '../../fs/operations/listFilesRecursive'
import { sha256 } from '../../hash/digesters/sha256'
import { normalizeRel } from '../converters/normalizeRel'
import { toClaudeRule } from '../converters/toClaudeRule'

export const checkClaudeRules = async (
  sourceFiles: string[],
  sourceDir: string,
  claudeRulesDir: string,
) => {
  const expectedMap = new Map()
  const mdcFiles = sourceFiles
    .filter((sourcePath: string) => sourcePath.endsWith('.mdc'))

    .sort((a: string, b: string) => a.localeCompare(b))

  for (const sourcePath of mdcFiles) {
    const rel = normalizeRel(path.relative(sourceDir, sourcePath)).replace(
      /\.mdc$/,
      '.md',
    )
    const sourceContent = await fs.readFile(sourcePath, 'utf8')

    expectedMap.set(rel, sha256(`${toClaudeRule(sourceContent)}\n`))
  }

  let actualFiles
  try {
    actualFiles = await listFilesRecursive(claudeRulesDir)
  } catch {
    return ['Missing generated directory: .claude/rules']
  }

  const actualMap = new Map()
  for (const actualPath of actualFiles) {
    const rel = normalizeRel(path.relative(claudeRulesDir, actualPath))

    const content = await fs.readFile(actualPath, 'utf-8')
    actualMap.set(rel, sha256(content))
  }

  const errors = []

  for (const [filePath, hash] of expectedMap.entries()) {
    if (!actualMap.has(filePath)) {
      errors.push(`Missing generated file: .claude/rules/${String(filePath)}`)
      continue
    }

    if (actualMap.get(filePath) !== hash) {
      errors.push(`Outdated generated file: .claude/rules/${String(filePath)}`)
    }
  }

  for (const filePath of actualMap.keys()) {
    if (!expectedMap.has(filePath)) {
      errors.push(
        `Unexpected generated file: .claude/rules/${String(filePath)}`,
      )
    }
  }

  return errors
}
