import { isValidSkillSourceSecurityException } from './isValidSkillSourceSecurityException'
import type { SkillSource } from './types/SkillSource'

export const collectSkillSourceErrors = (
  value: unknown,
  index: number,
  ids: Set<string>,
  errors: string[],
) => {
  const prefix = `sources[${String(index)}]`
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    errors.push(`${prefix} must be an object`)
    return
  }

  const raw = value as Record<string, unknown>
  const source = raw as Partial<SkillSource>
  if (typeof source.id !== 'string' || source.id.trim() === '') {
    errors.push(`${prefix}.id must be a non-empty string`)
  } else if (ids.has(source.id)) {
    errors.push(`${prefix}.id duplicates ${source.id}`)
  } else {
    ids.add(source.id)
  }
  if (
    typeof source.source !== 'string' ||
    !/^[^/\s]+\/[^/\s]+$/.test(source.source)
  ) {
    errors.push(`${prefix}.source must be an owner/repository slug`)
  }
  if (
    typeof source.resolvedCommit !== 'string' ||
    !/^[a-f0-9]{40}$/.test(source.resolvedCommit)
  ) {
    errors.push(`${prefix}.resolvedCommit must be a full lowercase commit SHA`)
  }
  if (!Array.isArray(source.skills) || source.skills.length === 0) {
    errors.push(`${prefix}.skills must be a non-empty array`)
  } else if (
    source.skills.some(
      (skill) =>
        typeof skill !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(skill),
    )
  ) {
    errors.push(`${prefix}.skills contains an invalid skill name`)
  } else if (new Set(source.skills).size !== source.skills.length) {
    errors.push(`${prefix}.skills contains duplicates`)
  }
  if (!Array.isArray(source.targets) || source.targets.length === 0) {
    errors.push(`${prefix}.targets must be a non-empty array`)
  } else if (
    source.targets.some((target) => typeof target !== 'string' || target === '')
  ) {
    errors.push(`${prefix}.targets contains an invalid target`)
  }
  if (
    raw['securityExceptions'] !== undefined &&
    (!Array.isArray(raw['securityExceptions']) ||
      raw['securityExceptions'].some(
        (exception: unknown) =>
          !isValidSkillSourceSecurityException(exception, source.skills ?? []),
      ))
  ) {
    errors.push(
      `${prefix}.securityExceptions contains an invalid reviewed exception`,
    )
  }
}
