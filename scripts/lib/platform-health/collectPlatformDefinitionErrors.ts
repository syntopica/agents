import { collectPlatformProbeErrors } from './collectPlatformProbeErrors'
import { isPlatformCapability } from './isPlatformCapability'

export const collectPlatformDefinitionErrors = (
  raw: unknown,
  index: number,
  registryIds: Set<string>,
  errors: string[],
): string | undefined => {
  if (typeof raw !== 'object' || raw === null) {
    errors.push(`platforms[${String(index)}] must be an object`)
    return undefined
  }

  const platform = raw as Record<string, unknown>
  const registryId = platform['registryId']

  if (typeof registryId !== 'string' || registryId.length === 0) {
    errors.push(
      `platforms[${String(index)}].registryId must be a non-empty string`,
    )
    return undefined
  }

  if (!registryIds.has(registryId))
    errors.push(`${registryId}: unknown registry id`)

  const capabilities = platform['capabilities']
  if (!Array.isArray(capabilities)) {
    errors.push(`${registryId}: capabilities must be an array`)
  } else {
    for (const capability of capabilities) {
      if (!isPlatformCapability(capability)) {
        errors.push(`${registryId}: unknown capability ${String(capability)}`)
      }
    }
  }

  collectPlatformProbeErrors(registryId, platform['probe'], errors)
  return registryId
}
