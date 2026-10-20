import { looksLikeSecurityCredential } from './looksLikeSecurityCredential'
import type { InspectSecurityCredentialNodeChildren } from './types/InspectSecurityCredentialNodeChildren'
import type { InspectSecurityCredentialNodeNode } from './types/InspectSecurityCredentialNodeNode'
import type { InspectSecurityCredentialNodeResult } from './types/InspectSecurityCredentialNodeResult'

export const inspectSecurityCredentialNode = (
  node: InspectSecurityCredentialNodeNode,
): InspectSecurityCredentialNodeResult => {
  if (typeof node.value === 'string') {
    return {
      findings: looksLikeSecurityCredential(node.value)
        ? [`${node.path} looks like a credential literal`]
        : [],
      children: [],
    }
  }
  if (typeof node.value !== 'object' || node.value === null) {
    return { findings: [], children: [] }
  }
  const findings: string[] = []
  const children: InspectSecurityCredentialNodeChildren[] = []
  for (const [key, value] of Object.entries(node.value)) {
    const path = `${node.path}.${key}`
    if (
      /(?:credential|password|secret|token|api[_-]?key|authorization)/i.test(
        key,
      )
    ) {
      findings.push(`${path} is a credential-shaped field`)
    } else {
      children.push({ path, value })
    }
  }
  return { findings, children }
}
