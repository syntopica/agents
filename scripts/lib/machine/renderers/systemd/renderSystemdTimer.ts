import type { ServiceDefinition } from '../../domains/services/types/ServiceDefinition'
import { toTimerSchedule } from './toTimerSchedule'

export const renderSystemdTimer = (
  service: ServiceDefinition,
): string | undefined => {
  if (service.schedule === undefined) {
    return undefined
  }

  return [
    '[Unit]',
    `Description=${service.name} timer`,
    '',
    '[Timer]',
    ...toTimerSchedule(service.schedule),
    'Persistent=true',
    '',
    '[Install]',
    'WantedBy=timers.target',
    '',
  ].join('\n')
}
