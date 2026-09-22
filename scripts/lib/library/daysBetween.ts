export const daysBetween = (from: string, to: string) => {
  const start = Date.parse(from)
  const end = Date.parse(to)

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return 0
  }

  return Math.floor((end - start) / 86400000)
}
