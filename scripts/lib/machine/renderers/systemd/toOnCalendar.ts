import type { CalendarSchedule } from '../../domains/services/types/CalendarSchedule'
import { SYSTEMD_WEEKDAYS } from './SYSTEMD_WEEKDAYS'

export const toOnCalendar = (schedule: CalendarSchedule): string => {
  const time = `${String(schedule.hour).padStart(2, '0')}:${String(schedule.minute).padStart(2, '0')}:00`
  const day =
    schedule.weekday === undefined
      ? undefined
      : SYSTEMD_WEEKDAYS[schedule.weekday]

  return day === undefined ? `*-*-* ${time}` : `${day} *-*-* ${time}`
}
