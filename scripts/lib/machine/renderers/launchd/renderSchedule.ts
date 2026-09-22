import type { ServiceSchedule } from '../../domains/services/types/ServiceSchedule'
import { renderCalendarInterval } from './renderCalendarInterval'
import { renderStartInterval } from './renderStartInterval'

export const renderSchedule = (schedule: ServiceSchedule): string[] =>
  schedule.intervalSeconds === undefined
    ? renderCalendarInterval(schedule)
    : renderStartInterval(schedule.intervalSeconds)
