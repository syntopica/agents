import type { CalendarSchedule } from './CalendarSchedule'
import type { IntervalSchedule } from './IntervalSchedule'

/**
 * Either a calendar slot or a polling interval. The interval form exists
 * because a calendar slot the machine sleeps through is never caught up:
 * `com.cristian.library-loop` missed its Sunday 06:30 run entirely on
 * 2026-08-23 and had to be inverted to a 6-hourly poll that decides for itself
 * whether the window is due.
 */
export type ServiceSchedule = CalendarSchedule | IntervalSchedule
