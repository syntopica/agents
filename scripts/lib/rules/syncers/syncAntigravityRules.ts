import path from 'node:path'
import { ensureDir } from '../../fs/operations/ensureDir'
import { toAntigravityRule } from '../converters/toAntigravityRule'
import { processSourceFile } from '../helpers/processors/processSourceFile'
import { writeRuleFile } from '../helpers/processors/writeRuleFile'

/**
 * Sync rules to Antigravity format (.agent/rules/)
 * @param {string[]} sourceFiles - Array of source .mdc files
 * @param {string} sourceDir - Source directory path
 * @param {string} targetDir - Target .agent/rules directory
 */
export async function syncAntigravityRules(
  sourceFiles: string[],
  sourceDir: string,
  targetDir: string,
) {
  await ensureDir(targetDir)
  const workflowsDir = path.join(path.dirname(targetDir), 'workflows')
  await ensureDir(workflowsDir)
  for (const file of sourceFiles) {
    const { parsed, relativePath } = await processSourceFile(file, sourceDir)
    const converted = toAntigravityRule(
      {
        rel: relativePath,
        content: parsed.content,
        ...(parsed.frontmatter ? { frontmatter: parsed.frontmatter } : {}),
      },

      relativePath,
    )

    for (const part of converted) {
      const targetPath = part.isWorkflow
        ? path.join(workflowsDir, `${part.name}.md`)
        : path.join(targetDir, `${part.name}.md`)

      await writeRuleFile(targetPath, part.content)
    }
  }
}
