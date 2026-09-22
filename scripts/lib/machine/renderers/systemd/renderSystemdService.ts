import type { ServiceDefinition } from '../../domains/services/types/ServiceDefinition'
import { toShellCommand } from '../launchd/toShellCommand'

export const renderSystemdService = (service: ServiceDefinition): string =>
  [
    '[Unit]',
    `Description=${service.name}`,
    '',
    '[Service]',
    'Type=oneshot',
    `WorkingDirectory=%h/${service.workingDirectory}`,
    `ExecStart=/bin/sh -lc '${toShellCommand(service, '%h').replaceAll("'", "'\\''")}'`,
    ...(service.keepAlive === true ? ['Restart=always'] : []),
    '',
    '[Install]',
    `WantedBy=${service.runAtLoad === true ? 'default.target' : 'timers.target'}`,
    '',
  ].join('\n')
