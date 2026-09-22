import type { ServiceSchedule } from '../../domains/services/types/ServiceSchedule'
import { toOnCalendar } from './toOnCalendar'

/**
 * The `[Timer]` line for a schedule. An interval maps to `OnUnitActiveSec` plus
 * an `OnBootSec` of the same length, so a machine that was off still runs one
 * interval after boot rather than waiting for a first activation that never
 * happened.
 */
export const toTimerSchedule = (schedule: ServiceSchedule): string[] =>
  schedule.intervalSeconds === undefined
    ? [`OnCalendar=${toOnCalendar(schedule)}`]
    : [
        `OnBootSec=${String(schedule.intervalSeconds)}s`,
        `OnUnitActiveSec=${String(schedule.intervalSeconds)}s`,
      ]
