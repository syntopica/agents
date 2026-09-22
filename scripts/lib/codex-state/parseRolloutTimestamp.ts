import { sep } from 'node:path'

export const parseRolloutTimestamp = (
  relativePath: string,
): Date | undefined => {
  const [yearDir, monthDir, dayDir, filename, ...rest] = relativePath.split(sep)
  if (rest.length > 0 || filename === undefined) return undefined
  const match =
    /^rollout-(\d{4})-(\d{2})-(\d{2})T(\d{2})-(\d{2})-(\d{2})-.+\.jsonl$/.exec(
      filename,
    )
  if (match === null) return undefined
  const [, yearText, monthText, dayText, hourText, minuteText, secondText] =
    match
  if (yearText !== yearDir || monthText !== monthDir || dayText !== dayDir)
    return undefined
  const parts = [
    yearText,
    monthText,
    dayText,
    hourText,
    minuteText,
    secondText,
  ].map(Number)
  const [year, month, day, hour, minute, second] = parts
  if (
    year === undefined ||
    month === undefined ||
    day === undefined ||
    hour === undefined ||
    minute === undefined ||
    second === undefined
  ) {
    return undefined
  }
  const timestamp = new Date(
    Date.UTC(year, month - 1, day, hour, minute, second),
  )
  if (
    timestamp.getUTCFullYear() !== year ||
    timestamp.getUTCMonth() !== month - 1 ||
    timestamp.getUTCDate() !== day ||
    timestamp.getUTCHours() !== hour ||
    timestamp.getUTCMinutes() !== minute ||
    timestamp.getUTCSeconds() !== second
  ) {
    return undefined
  }
  return timestamp
}
