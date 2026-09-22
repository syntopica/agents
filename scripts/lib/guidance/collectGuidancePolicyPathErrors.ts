import { isSafeAbsolutePathList } from './isSafeAbsolutePathList'

export const collectGuidancePolicyPathErrors = (
  readAllowlist: unknown,
  bootstrapFiles: unknown,
): string[] => {
  const errors: string[] = []
  for (const [value, label] of [
    [readAllowlist, 'agentReadAllowlist'],
    [bootstrapFiles, 'agentBootstrapFiles'],
  ] as const)
    if (value !== undefined && !isSafeAbsolutePathList(value))
      errors.push(`${label} must contain safe absolute paths`)
  return errors
}
