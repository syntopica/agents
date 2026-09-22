// StartCalendarInterval does not catch up a run the machine slept through: the
// 2026-08-23 06:30 run never fired and left no report. The schedule is therefore
// a frequent poll, and this decides whether the window is actually due.
export const isLoopDue = (
  reportNames: string[],
  intervalDays: number,
  now: Date,
) => {
  const cutoff = now.getTime() - intervalDays * 24 * 60 * 60 * 1000

  return !reportNames.some((name) => {
    const day = /^(\d{4}-\d{2}-\d{2})-library-loop\.md$/.exec(name)?.[1]

    if (day === undefined) {
      return false
    }

    const written = Date.parse(`${day}T00:00:00Z`)

    return Number.isFinite(written) && written >= cutoff
  })
}
