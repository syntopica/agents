import { ANTHROPIC_ONLY_FRONTMATTER_FIELDS } from './constants/ANTHROPIC_ONLY_FRONTMATTER_FIELDS'
import { PORTABLE_SKILL_FIELDS } from './constants/PORTABLE_SKILL_FIELDS'
import { TARGET_EXTENSION_SKILL_FIELDS } from './constants/TARGET_EXTENSION_SKILL_FIELDS'
import { parsePortabilityFrontmatter } from './parsePortabilityFrontmatter'
import { splitFrontmatter } from './transformers/splitFrontmatter'
import { stripQuotes } from './transformers/stripQuotes'
import type { SkillPortabilityFinding } from './types/SkillPortabilityFinding'

export const classifySkillPortability = (
  path: string,
  contents: string,
): SkillPortabilityFinding => {
  const normalizedPath = path.replaceAll('\\', '/')
  if (
    /(?:^|\/)(?:fixtures?|examples?|samples?|test-data)(?:\/|$)/i.test(
      normalizedPath,
    )
  ) {
    return {
      path,
      kind: 'fixture',
      fields: [],
      reasons: ['path is reserved for fixtures'],
    }
  }
  const { frontmatter } = splitFrontmatter(contents.replaceAll('\r\n', '\n'))
  if (frontmatter === '') {
    return {
      path,
      kind: 'invalid',
      fields: [],
      reasons: ['frontmatter is missing or malformed'],
    }
  }
  const parsed = parsePortabilityFrontmatter(frontmatter)
  const fields = [...parsed.fields.keys()]
  const allowed: ReadonlySet<string> = new Set<string>([
    ...PORTABLE_SKILL_FIELDS,
    ...ANTHROPIC_ONLY_FRONTMATTER_FIELDS,
    ...TARGET_EXTENSION_SKILL_FIELDS,
  ])
  const unknown = fields.filter((field) => !allowed.has(field.toLowerCase()))
  const name = stripQuotes(parsed.fields.get('name') ?? '')
  const descriptionValue = stripQuotes(parsed.fields.get('description') ?? '')
  const descriptionPresent =
    descriptionValue !== '' || /^description:\s*\n[ \t]+\S/m.test(frontmatter)
  const errors = [
    ...parsed.errors,
    ...unknown.map((field) => `${field} is not a recognized skill field`),
    ...(name === '' ? ['name is required'] : []),
    ...(!parsed.fields.has('description') || !descriptionPresent
      ? ['description is required']
      : []),
  ]
  if (errors.length > 0)
    return { path, kind: 'invalid', fields, reasons: errors }

  const targetFields = fields.filter(
    (field) =>
      field !== field.toLowerCase() ||
      TARGET_EXTENSION_SKILL_FIELDS.includes(field.toLowerCase() as never),
  )
  if (targetFields.length > 0 || name.includes(':')) {
    return {
      path,
      name,
      kind: 'target-extension',
      fields,
      reasons: name.includes(':')
        ? ['logical name requires a filesystem alias']
        : targetFields,
    }
  }
  const claudeFields = fields.filter((field) =>
    ANTHROPIC_ONLY_FRONTMATTER_FIELDS.includes(field as never),
  )
  return claudeFields.length > 0
    ? { path, name, kind: 'claude-extension', fields, reasons: claudeFields }
    : { path, name, kind: 'portable', fields, reasons: [] }
}
