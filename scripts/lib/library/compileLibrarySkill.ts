import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { compilePortableSkillContents } from './compilePortableSkillContents'
import { replaceCompiledSkillName } from './replaceCompiledSkillName'
import { resolveTargetSkillName } from './resolveTargetSkillName'
import type { CompiledSkill } from './types/CompiledSkill'
import type { CompileLibrarySkillOptions } from './types/CompileLibrarySkillOptions'

export const compileLibrarySkill = async (
  options: CompileLibrarySkillOptions,
): Promise<CompiledSkill> => {
  const targetName = resolveTargetSkillName(options.logicalName, options.target)
  if (targetName === '')
    throw new Error(
      `skill has no filesystem-safe alias: ${options.logicalName}`,
    )
  const outputPath = join(options.outputRoot, targetName)
  await mkdir(options.outputRoot, { recursive: true })
  await rm(outputPath, { recursive: true, force: true })
  await cp(options.sourcePath, outputPath, { recursive: true })
  const skillPath = join(outputPath, 'SKILL.md')
  const contents = await readFile(skillPath, 'utf8')
  const compiled =
    options.target === 'claude'
      ? replaceCompiledSkillName(contents, targetName)
      : compilePortableSkillContents(contents, targetName)
  await writeFile(skillPath, compiled)
  return {
    logicalName: options.logicalName,
    targetName,
    sourcePath: options.sourcePath,
    outputPath,
  }
}
