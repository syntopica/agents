import { TARGET_EXTENSION_SKILL_FIELDS } from '../skills/constants/TARGET_EXTENSION_SKILL_FIELDS'
import { replaceFrontmatter } from '../skills/transformers/replaceFrontmatter'
import { splitFrontmatter } from '../skills/transformers/splitFrontmatter'
import { stripAnthropicOnlyFields } from '../skills/transformers/stripAnthropicOnlyFields'
import { stripFrontmatterKeys } from '../skills/transformers/stripFrontmatterKeys'
import { replaceCompiledSkillName } from './replaceCompiledSkillName'

export const compilePortableSkillContents = (
  contents: string,
  targetName: string,
): string => {
  const withoutClaudeFields = stripAnthropicOnlyFields(contents)
  const { frontmatter } = splitFrontmatter(withoutClaudeFields)
  if (frontmatter === '') return withoutClaudeFields
  const targetFields = [
    ...TARGET_EXTENSION_SKILL_FIELDS,
    ...TARGET_EXTENSION_SKILL_FIELDS.map(
      (field) => `${field.slice(0, 1).toUpperCase()}${field.slice(1)}`,
    ),
  ]
  const portable = replaceFrontmatter(
    withoutClaudeFields,
    stripFrontmatterKeys(frontmatter, targetFields),
  )
  return replaceCompiledSkillName(portable, targetName)
}
