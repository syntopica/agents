import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { classifySkillPortability } from '../../skills/classifySkillPortability'
import { ANTHROPIC_ONLY_FRONTMATTER_FIELDS } from '../../skills/constants/ANTHROPIC_ONLY_FRONTMATTER_FIELDS'
import type { CompiledSkill } from '../types/CompiledSkill'
import type { SkillTarget } from '../types/SkillTarget'

export const validateCompiledLibrary = async (
  compiled: CompiledSkill[],
  target: SkillTarget,
): Promise<string[]> => {
  const errors: string[] = []
  for (const skill of compiled) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(skill.targetName)) {
      errors.push(`${skill.logicalName}: target name is not filesystem-safe`)
    }
    const path = join(skill.outputPath, 'SKILL.md')
    const finding = classifySkillPortability(path, await readFile(path, 'utf8'))
    if (finding.kind === 'invalid')
      errors.push(`${skill.logicalName}: compiled skill is invalid`)
    const claudeFields = finding.fields.filter((field) =>
      ANTHROPIC_ONLY_FRONTMATTER_FIELDS.includes(field as never),
    )
    if (target !== 'claude' && claudeFields.length > 0) {
      errors.push(
        `${skill.logicalName}: compiled skill retains a Claude extension`,
      )
    }
    if (target !== 'claude' && finding.name !== skill.targetName) {
      errors.push(
        `${skill.logicalName}: compiled name does not match its target alias`,
      )
    }
  }
  return errors
}
