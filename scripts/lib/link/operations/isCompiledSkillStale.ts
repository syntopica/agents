import { promises as fs } from 'node:fs'
import path from 'node:path'
import { listFilesRecursive } from '../../fs/operations/listFilesRecursive'
import { stripRulesIndex } from './stripRulesIndex'

/**
 * Whether a compiled skill no longer matches its source: a different set of
 * files (one added to or deleted from the source), or a file whose content
 * differs (SKILL.md compared without the generated rules index).
 */
export const isCompiledSkillStale = async (
  sourceDir: string,
  compiledDir: string,
): Promise<boolean> => {
  const sourceFiles = (await listFilesRecursive(sourceDir)).map((file) =>
    path.relative(sourceDir, file),
  )
  const compiledFiles = await listFilesRecursive(compiledDir)
    .then((files) => files.map((file) => path.relative(compiledDir, file)))
    .catch(() => [])
  if (sourceFiles.join('\n') !== compiledFiles.join('\n')) return true
  for (const relative of sourceFiles) {
    const source = await fs.readFile(path.join(sourceDir, relative))
    const compiled = await fs.readFile(path.join(compiledDir, relative))
    if (path.basename(relative) === 'SKILL.md') {
      if (
        stripRulesIndex(source.toString('utf8')) !==
        stripRulesIndex(compiled.toString('utf8'))
      )
        return true
      continue
    }
    if (!source.equals(compiled)) return true
  }
  return false
}
