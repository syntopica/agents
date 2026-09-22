import type { CodexStateReport } from './types/CodexStateReport'

export const isCodexStateHealthy = (report: CodexStateReport): boolean =>
  report.malformedSessions.length === 0 &&
  report.databases.every(
    ({ status }) => status === 'ok' || status === 'missing',
  )
