import path from 'node:path'
import { toWindsurfRule } from '../converters/toWindsurfRule'
import { compareRuleFile } from '../helpers/processors/compareRuleFile'
import { processSourceFile } from '../helpers/processors/processSourceFile'

/**
 * Check if Windsurf rules are in sync
 * @param {string[]} sourceFiles - Array of source .mdc files
 * @param {string} sourceDir - Source directory path
 * @param {string} targetDir - Target .windsurf/rules directory
 * @returns {Promise<string[]>} - Array of error messages
 */
export async function checkWindsurfRules(
  sourceFiles: string[],
  sourceDir: string,
  targetDir: string,
) {
  const errors = []
  for (const file of sourceFiles) {
    const { parsed, relativePath } = await processSourceFile(file, sourceDir)
    const expected = toWindsurfRule(parsed, relativePath)
    const targetPath = path.join(
      targetDir,
      relativePath.replace(/\.mdc$/, '.md'),
    )

    const { missing, outdated } = await compareRuleFile(targetPath, expected)
    if (missing) errors.push(`Missing Windsurf rule: ${targetPath}`)
    else if (outdated) errors.push(`Outdated Windsurf rule: ${targetPath}`)
  }

  return errors
}
