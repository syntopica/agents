import { readGuidanceFlag } from './readGuidanceFlag'

export const readAliasedGuidanceFlag = (
  argv: string[],
  name: string,
  compatibilityAlias: string,
): string | undefined => {
  const value = readGuidanceFlag(argv, name)
  const compatibilityValue = readGuidanceFlag(argv, compatibilityAlias)
  if (
    value !== undefined &&
    compatibilityValue !== undefined &&
    value !== compatibilityValue
  )
    throw new Error(`conflicting values for ${name} and ${compatibilityAlias}`)
  return value ?? compatibilityValue
}
