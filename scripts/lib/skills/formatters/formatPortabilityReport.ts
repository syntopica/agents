import type { SkillPortabilityFinding } from '../types/SkillPortabilityFinding'

export const formatPortabilityReport = (
  findings: SkillPortabilityFinding[],
  asJson: boolean,
): string => {
  const counts = Object.fromEntries(
    [...new Set(findings.map(({ kind }) => kind))]
      .toSorted((left, right) => left.localeCompare(right))
      .map((kind) => [
        kind,
        findings.filter((finding) => finding.kind === kind).length,
      ]),
  )
  return asJson
    ? JSON.stringify({ total: findings.length, counts, findings }, null, 2)
    : [
        `Skills inspected: ${String(findings.length)}`,
        ...Object.entries(counts).map(
          ([kind, count]) => `  ${kind}: ${String(count)}`,
        ),
      ].join('\n')
}
