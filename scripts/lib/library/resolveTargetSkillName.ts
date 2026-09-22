import type { SkillTarget } from './types/SkillTarget'

export const resolveTargetSkillName = (
  logicalName: string,
  target: SkillTarget,
): string => {
  if (target.trim() === '') return ''
  const leaf = logicalName.split('/').at(-1) ?? logicalName
  return leaf
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
