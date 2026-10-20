import { renderLaunchAgent } from '../../renderers/launchd/renderLaunchAgent'
import { renderSystemdService } from '../../renderers/systemd/renderSystemdService'
import { renderSystemdTimer } from '../../renderers/systemd/renderSystemdTimer'
import type { RenderServiceUnitsInput } from './types/RenderServiceUnitsInput'
import type { ServiceUnit } from './types/ServiceUnit'

export const renderServiceUnits = ({
  service,
  platform,
}: RenderServiceUnitsInput): ServiceUnit[] => {
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
