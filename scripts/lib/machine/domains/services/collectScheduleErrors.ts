export const collectScheduleErrors = (
  raw: unknown,
  at: string,
  errors: string[],
) => {
  if (raw === undefined) {
    return
  }

  if (typeof raw !== 'object' || raw === null) {
    errors.push(`${at}.schedule must be an object`)
    return
  }

  const schedule = raw as Record<string, unknown>

  if (schedule['intervalSeconds'] !== undefined) {
    if (
      typeof schedule['intervalSeconds'] !== 'number' ||
      !Number.isInteger(schedule['intervalSeconds']) ||
      schedule['intervalSeconds'] < 1
    ) {
      errors.push(`${at}.schedule.intervalSeconds must be a positive integer`)
    }
    if (schedule['hour'] !== undefined || schedule['minute'] !== undefined) {
      errors.push(
        `${at}.schedule must be an interval or a calendar slot, not both`,
      )
    }
    return
  }

  const ranges: [string, number, number][] = [
    ['hour', 0, 23],
    ['minute', 0, 59],
  ]

  for (const [key, min, max] of ranges) {
    const value = schedule[key]
    if (
      typeof value !== 'number' ||
      !Number.isInteger(value) ||
      value < min ||
      value > max
    ) {
      errors.push(
        `${at}.schedule.${key} must be an integer between ${String(min)} and ${String(max)}`,
      )
    }
  }

  if (
    schedule['weekday'] !== undefined &&
    (typeof schedule['weekday'] !== 'number' ||
      !Number.isInteger(schedule['weekday']) ||
      schedule['weekday'] < 0 ||
      schedule['weekday'] > 6)
  ) {
    errors.push(`${at}.schedule.weekday must be an integer between 0 and 6`)
  }
}
