import { inspectSecurityCredentialNode } from './inspectSecurityCredentialNode'

export const findSecurityCredentialLiterals = (raw: unknown): string[] => {
  const findings: string[] = []
  const pending: { path: string; value: unknown }[] = [
    { path: 'manifest', value: raw },
  ]
  while (pending.length > 0) {
    const current = pending.pop()
    if (current === undefined) continue
    const inspected = inspectSecurityCredentialNode(current)
    findings.push(...inspected.findings)
    pending.push(...inspected.children)
  }
  return findings.toSorted((left, right) => left.localeCompare(right))
}
