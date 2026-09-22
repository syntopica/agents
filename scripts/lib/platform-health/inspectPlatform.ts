import { inspectCapability } from './inspectCapability'
import type { PlatformHealth } from './types/PlatformHealth'
import type { PlatformInspectionInput } from './types/PlatformInspectionInput'

export const inspectPlatform = async ({
  definition,
  runtime,
  paths,
}: PlatformInspectionInput): Promise<PlatformHealth> => {
  const capabilities =
    runtime.lifecycle === 'unavailable'
      ? definition.capabilities.map((capability) => ({
          capability,
          status: 'not-applicable' as const,
          summary: 'platform runtime is unavailable',
          findings: [],
        }))
      : await Promise.all(
          definition.capabilities.map((capability) =>
            inspectCapability(capability, paths),
          ),
        )

  return {
    registryId: definition.registryId,
    lifecycle: runtime.lifecycle,
    probes: runtime.probes,
    capabilities,
  }
}
