import type { PlatformHealth } from '../types/PlatformHealth'

export const formatHealthMatrix = (report: PlatformHealth[]): string =>
  [
    'Platform           Lifecycle     Capabilities',
    '-----------------  ------------  ----------------------------------------',
    ...report.map(({ registryId, lifecycle, capabilities }) => {
      const statuses = capabilities
        .map(({ capability, status }) => `${capability}:${status}`)
        .join(', ')
      return `${registryId.padEnd(17)}  ${lifecycle.padEnd(12)}  ${statuses}`
    }),
  ].join('\n')
