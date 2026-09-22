export const createRunId = (now: Date, random: () => number) => {
  const stamp = now
    .toISOString()
    .replace(/[:.]/g, '-')
    .replace(/-\d{3}Z$/, '')
  const suffix = Math.floor(random() * 1e6).toString(36)
  return `${stamp}-${suffix}`
}
