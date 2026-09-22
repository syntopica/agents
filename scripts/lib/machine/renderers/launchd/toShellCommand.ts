import type { ServiceDefinition } from '../../domains/services/types/ServiceDefinition'

export const toShellCommand = (
  service: ServiceDefinition,
  homeToken: string,
): string => {
  const redirect =
    service.logPath === undefined
      ? ''
      : ` >> "${homeToken}/${service.logPath}" 2>&1`

  return `cd "${homeToken}/${service.workingDirectory}" && ${service.command}${redirect}`
}
