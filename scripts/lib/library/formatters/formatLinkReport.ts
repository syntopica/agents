import type { LinkReport } from '../types/LinkReport'

export const formatLinkReport = (report: LinkReport, asJson: boolean) => {
  if (asJson) {
    return JSON.stringify(report, null, 2)
  }

  const header = `target ${report.target}: ${String(report.planned)} adopted, ${String(report.linked)} linked`

  return [
    header,
    ...report.created.map((name) => `  + ${name}`),
    ...report.missing.map((line) => `  ! ${line}`),
    ...report.foreign.map((line) => `  ~ ${line}`),
  ].join('\n')
}
