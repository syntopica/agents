import { redactHealthText } from '../platform-health/redactHealthText'
import type { CodexStateReport } from './types/CodexStateReport'

export const redactCodexStateReport = (
  report: CodexStateReport,
  home: string,
): CodexStateReport => ({
  ...report,
  codexDir: redactHealthText(report.codexDir, home),
  databases: report.databases.map((database) => ({
    ...database,
    path: redactHealthText(database.path, home),
    summary: redactHealthText(database.summary, home),
  })),
  malformedSessions: report.malformedSessions.map((finding) => ({
    ...finding,
    path: redactHealthText(finding.path, home),
    summary: redactHealthText(finding.summary, home),
  })),
})
