import type { CalendarSchedule } from '../../domains/services/types/CalendarSchedule'

export const renderCalendarInterval = (
  schedule: CalendarSchedule,
): string[] => {
  const entries: [string, number][] = [
    ...(schedule.weekday === undefined
      ? []
      : ([['Weekday', schedule.weekday]] as [string, number][])),
    ['Hour', schedule.hour],
    ['Minute', schedule.minute],
  ]

  return [
    '  <key>StartCalendarInterval</key>',
    '  <dict>',
    ...entries.flatMap(([key, value]) => [
      `    <key>${key}</key>`,
      `    <integer>${String(value)}</integer>`,
    ]),
    '  </dict>',
  ]
}
