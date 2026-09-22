export const createGuidanceRunId = (): string =>
  `${new Date()
    .toISOString()
    .replaceAll(':', '-')
    .replace(/\.\d{3}Z$/u, '')}-${crypto.randomUUID().slice(0, 8)}`
