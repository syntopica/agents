import type { CodexStateReport } from '../types/CodexStateReport'

export const formatCodexStateReport = (report: CodexStateReport): string =>
  [
    `Codex state: ${report.codexDir}`,
    ...report.databases.map(
      ({ path, status, summary }) =>
        `  ${path.split('/').at(-1) ?? path}: ${status} (${summary})`,
    ),
    `Sessions: ${String(report.sessionCount)} files, ${String(report.sessionBytes)} bytes`,
    `Malformed sessions: ${String(report.malformedSessions.length)}`,
  ].join('\n')
