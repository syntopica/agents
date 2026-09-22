import { renderLaunchAgent } from '../../renderers/launchd/renderLaunchAgent'
import { renderSystemdService } from '../../renderers/systemd/renderSystemdService'
import { renderSystemdTimer } from '../../renderers/systemd/renderSystemdTimer'
import type { ServiceDefinition } from './types/ServiceDefinition'
import type { ServicesPlatform } from './types/ServicesPlatform'
import type { ServiceUnit } from './types/ServiceUnit'

export const renderServiceUnits = ({
  service,
  platform,
}: {
  service: ServiceDefinition
  platform: ServicesPlatform
}): ServiceUnit[] => {
  if (platform === 'launchd') {
    return [
      { file: `${service.name}.plist`, contents: renderLaunchAgent(service) },
    ]
  }

  const timer = renderSystemdTimer(service)

  return [
    {
      file: `${service.name}.service`,
      contents: renderSystemdService(service),
    },
    ...(timer === undefined
      ? []
      : [{ file: `${service.name}.timer`, contents: timer }]),
  ]
}
