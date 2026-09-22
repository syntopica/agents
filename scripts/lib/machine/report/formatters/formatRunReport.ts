import type { RunReport } from '../../types/RunReport'

export const formatRunReport = (report: RunReport, asJson: boolean) => {
  if (asJson) {
    return JSON.stringify(report, null, 2)
  }

  const lines = [`run ${report.runId} profile ${report.profile}`]

  for (const domain of report.domains) {
    lines.push(
      `  ${domain.domain.padEnd(10)} ${domain.status.padEnd(12)} ${String(domain.changes)}`,
    )

    for (const message of domain.messages) {
      lines.push(`      ${message}`)
    }
  }

  return lines.join('\n')
}
